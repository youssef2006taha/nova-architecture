import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";

let scrollLockCount = 0;
let originalBodyStyles;
const activeDialogStack = [];
const OVERFLOW_PROPERTIES = ["overflow", "overflow-x", "overflow-y"];

const captureInlineStyles = (element, properties) =>
  Array.from({ length: element.style.length }, (_, index) =>
    element.style.item(index),
  )
    .filter((property) => properties.includes(property))
    .map((property) => ({
      property,
      value: element.style.getPropertyValue(property),
      priority: element.style.getPropertyPriority(property),
    }));

const restoreInlineStyles = (element, properties, styles) => {
  properties.forEach((property) => element.style.removeProperty(property));
  styles.forEach(({ property, value, priority }) => {
    element.style.setProperty(property, value, priority);
  });
};

const restoreInlineProperty = (element, property, value, priority) => {
  if (value) {
    element.style.setProperty(property, value, priority);
  } else {
    element.style.removeProperty(property);
  }
};

const getFocusableElements = (element) =>
  Array.from(
    element.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((candidate) => candidate.getClientRects().length > 0);

function acquireScrollLock(compensateScrollbar) {
  if (scrollLockCount === 0) {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const isRtl = document.documentElement.dir === "rtl";
    const paddingProperty = isRtl ? "padding-left" : "padding-right";
    const shouldCompensateScrollbar =
      compensateScrollbar && scrollbarWidth > 0;
    const computedPadding = shouldCompensateScrollbar
      ? Number.parseFloat(
          window.getComputedStyle(document.body).getPropertyValue(paddingProperty),
        ) || 0
      : 0;

    originalBodyStyles = {
      overflow: captureInlineStyles(document.body, OVERFLOW_PROPERTIES),
      padding: shouldCompensateScrollbar
        ? {
            property: paddingProperty,
            value: document.body.style.getPropertyValue(paddingProperty),
            priority: document.body.style.getPropertyPriority(paddingProperty),
          }
        : null,
    };
    OVERFLOW_PROPERTIES.forEach((property) => {
      document.body.style.setProperty(property, "hidden", "important");
    });
    if (shouldCompensateScrollbar) {
      document.body.style.setProperty(
        paddingProperty,
        `${computedPadding + scrollbarWidth}px`,
      );
    }
  }

  scrollLockCount += 1;
  return () => {
    scrollLockCount -= 1;
    if (scrollLockCount === 0 && originalBodyStyles) {
      restoreInlineStyles(
        document.body,
        OVERFLOW_PROPERTIES,
        originalBodyStyles.overflow,
      );
      if (originalBodyStyles.padding) {
        restoreInlineProperty(
          document.body,
          originalBodyStyles.padding.property,
          originalBodyStyles.padding.value,
          originalBodyStyles.padding.priority,
        );
      }
      originalBodyStyles = undefined;
    }
  };
}

function Backdrop({
  children,
  header,
  onClose,
  open: controlledOpen,
  zIndexClassName = "z-[9999]",
  containerClassName = "",
  overlayClassName = "",
  modalClassName = "",
  showCloseButton = true,
  animateModal = true,
  animateOverlay = true,
  animationMode = "modal",
  slideDirection = "right",
  positionClassName = "items-center justify-center p-4",
  lockScroll = false,
  compensateScrollbar = true,
  ariaLabel,
  ariaLabelledBy,
  closeLabel = "Close dialog",
  dialogId,
}) {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const isClosingRef = useRef(false);
  const focusReturnRef = useRef(null);
  const handleCloseRef = useRef(null);
  const generatedDialogId = useId();
  const headingId = useId();
  const resolvedDialogId = dialogId || generatedDialogId;
  const isOpen = controlledOpen === undefined ? Boolean(children) : controlledOpen;
  const [isPresent, setIsPresent] = useState(isOpen);
  const [previousOpen, setPreviousOpen] = useState(isOpen);

  if (isOpen !== previousOpen) {
    setPreviousOpen(isOpen);
    if (isOpen) setIsPresent(true);
  }

  useLayoutEffect(() => {
    if (!isPresent || !lockScroll) return;
    return acquireScrollLock(compensateScrollbar);
  }, [isPresent, lockScroll, compensateScrollbar]);

  useLayoutEffect(() => {
    if (!isPresent || !modalRef.current) return undefined;

    const dialog = modalRef.current;
    const entry = { dialog };
    const previousFocus = document.activeElement;
    focusReturnRef.current = previousFocus;
    activeDialogStack.push(entry);

    const focusableElements = getFocusableElements(dialog);
    (focusableElements[0] || dialog).focus({ preventScroll: true });

    const handleKeyDown = (event) => {
      if (activeDialogStack[activeDialogStack.length - 1] !== entry) return;

      if (event.key === "Escape") {
        event.preventDefault();
        handleCloseRef.current?.();
        return;
      }

      if (event.key !== "Tab") return;
      const currentFocusableElements = getFocusableElements(dialog);
      if (currentFocusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = currentFocusableElements[0];
      const lastElement =
        currentFocusableElements[currentFocusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      } else if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      const wasTopDialog =
        activeDialogStack[activeDialogStack.length - 1] === entry;
      const stackIndex = activeDialogStack.indexOf(entry);
      if (stackIndex !== -1) activeDialogStack.splice(stackIndex, 1);

      const target = focusReturnRef.current;
      const nextTopDialog = activeDialogStack[activeDialogStack.length - 1];
      if (
        wasTopDialog &&
        target?.isConnected &&
        (!nextTopDialog || nextTopDialog.dialog.contains(target))
      ) {
        target.focus({ preventScroll: true });
      }
      if (wasTopDialog) focusReturnRef.current = null;
    };
  }, [isPresent]);

  useLayoutEffect(() => {
    if (!isPresent || !overlayRef.current || !modalRef.current) return;

    const context = gsap.context(() => {
      const drawerOffset = slideDirection === "left" ? "-100%" : "100%";
      const timeline = gsap.timeline({
        onComplete: () => {
          if (!isOpen) setIsPresent(false);
        },
      });

      if (isOpen) {
        isClosingRef.current = false;
        if (animateOverlay) {
          timeline.fromTo(
            overlayRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.25, ease: "power2.out" },
          );
        }

        if (animationMode === "expand") {
          gsap.set(modalRef.current, { height: 0, overflow: "hidden" });
          timeline.to(modalRef.current, {
            height: "auto",
            duration: 0.36,
            ease: "power2.out",
          }, 0);
        } else if (animationMode === "slide") {
          gsap.set(modalRef.current, { x: drawerOffset });
          timeline.to(modalRef.current, {
            x: "0%",
            duration: 0.48,
            ease: "back.out(1.08)",
          }, 0);
        } else if (animateModal) {
          timeline.fromTo(
            modalRef.current,
            { opacity: 0, scale: 0.9, y: 15 },
            { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "back.out(1.2)" },
            0,
          );
        }
      } else {
        if (animateOverlay) {
          timeline.to(overlayRef.current, {
            opacity: 0,
            duration: 0.2,
            ease: "power2.in",
          });
        }

        if (animationMode === "expand") {
          timeline.to(modalRef.current, {
            height: 0,
            duration: 0.28,
            ease: "power2.in",
          }, 0);
        } else if (animationMode === "slide") {
          timeline.to(modalRef.current, {
            x: drawerOffset,
            duration: 0.32,
            ease: "power2.in",
          }, 0);
        } else if (animateModal) {
          timeline.to(modalRef.current, {
            opacity: 0,
            scale: 0.9,
            y: 10,
            duration: 0.2,
            ease: "power2.in",
          }, 0);
        }
      }
    });

    return () => context.revert();
  }, [isOpen, isPresent, animateModal, animateOverlay, animationMode, slideDirection]);

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    if (controlledOpen !== undefined) {
      onClose?.();
      return;
    }

    gsap.timeline({ onComplete: () => onClose?.() })
      .to(overlayRef.current, { opacity: 0, duration: 0.2, ease: "power2.in" })
      .to(modalRef.current, {
        opacity: 0,
        scale: 0.9,
        y: 10,
        duration: 0.2,
        ease: "power2.in",
      }, "<");
  }, [controlledOpen, onClose]);
  useLayoutEffect(() => {
    handleCloseRef.current = handleClose;
  }, [handleClose]);

  if (!isPresent) return null;

  return createPortal(
    <div className={`fixed inset-0 ${zIndexClassName} flex ${positionClassName} ${containerClassName}`}>
      <div 
        ref={overlayRef}
        className={`fixed inset-0 bg-primary/5 backdrop-blur-sm cursor-pointer ${overlayClassName}`}
        onClick={handleClose}
      />

      <div
        id={resolvedDialogId}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy || (header ? headingId : undefined)}
        aria-label={!ariaLabelledBy && !header ? ariaLabel : undefined}
        tabIndex={-1}
        className={`
          relative z-10
          rounded-2xl overflow-hidden
          bg-bg-surface border border-text-light/10 shadow-2xl p-2
          ${modalClassName}
        `}
      >
        {header ? (
          <div className="py-3 px-4 md:px-6 flex justify-between items-center border-b border-primary/40">
            <h4 id={headingId} className="text-sm md:text-base lg:text-lg font-semibold text-primary">{header}</h4>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-full bg-primary/30 text-text-main hover:bg-primary/70 transition-colors cursor-pointer"
              aria-label={closeLabel}
            >
              <X size={20} />
            </button>
          </div>
        ) : showCloseButton ? (
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 p-1 rounded-full bg-black/40 text-white hover:bg-black/90 transition-colors cursor-pointer"
            aria-label={closeLabel}
          >
            <X size={20} />
          </button>
        ) : null}

        {children}
      </div>
    </div>,
    document.body
  );
}

export default Backdrop;