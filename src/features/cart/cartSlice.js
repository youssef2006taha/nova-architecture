import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  addToCartApi,
  applyCouponApi,
  getCart,
  removeCouponApi,
  removeFromCartApi,
} from "../../api/cart/cart.api";
import { sessionExpired } from "../authentication/auth/authSlice";
import { fetchSession } from "../authentication/auth/thunk/fetchSession";
import { login } from "../authentication/auth/thunk/loginThunk";
import { logout } from "../authentication/auth/thunk/logoutThunk";

const getApiErrorMessage = (error, fallback) =>
  error?.response?.data?.errors?.[0] ||
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const mapServerCart = (cart) => {
  const isEmptyCart = Array.isArray(cart?.items) && cart.items.length === 0;
  const subTotal =
    isEmptyCart && cart.subTotal == null ? 0 : Number(cart?.subTotal);
  const discountAmount =
    isEmptyCart && cart.discountAmount == null
      ? 0
      : Number(cart?.discountAmount);
  const total = isEmptyCart && cart.total == null ? 0 : Number(cart?.total);

  if (
    !cart ||
    !Array.isArray(cart.items) ||
    !Number.isFinite(subTotal) ||
    !Number.isFinite(discountAmount) ||
    !Number.isFinite(total) ||
    (cart.couponCode != null && typeof cart.couponCode !== "string")
  ) {
    throw new Error("The cart response did not match the documented format.");
  }

  const items = cart.items.map((item) => {
    const price = Number(item.price);
    const effectivePrice = Number(item.effectivePrice);
    const discountPrice =
      item.discountPrice == null ? null : Number(item.discountPrice);

    if (
      item.courseId == null ||
      typeof item.courseTitle !== "string" ||
      !Number.isFinite(price) ||
      !Number.isFinite(effectivePrice) ||
      (discountPrice !== null && !Number.isFinite(discountPrice))
    ) {
      throw new Error("A cart item did not match the documented format.");
    }

    return {
      id: item.courseId,
      title: item.courseTitle,
      price,
      discountPrice,
      effectivePrice,
      imageUrl: "",
      type: "course",
      quantity: 1,
    };
  });

  return {
    items,
    totals: {
      subTotal,
      discountAmount,
      total,
    },
    couponCode: cart.couponCode ?? null,
  };
};

const loadServerCart = async () => {
  const response = await getCart();
  try {
    return mapServerCart(response);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("The cart API response did not match its contract.", {
        responseKeys:
          response && typeof response === "object"
            ? Object.keys(response)
            : [],
        itemsType: Array.isArray(response?.items)
          ? "array"
          : typeof response?.items,
        firstItemKeys:
          response?.items?.[0] && typeof response.items[0] === "object"
            ? Object.keys(response.items[0])
            : [],
        totals: {
          subTotal: typeof response?.subTotal,
          discountAmount: typeof response?.discountAmount,
          total: typeof response?.total,
        },
      });
    }
    throw error;
  }
};

const canMutateCart = (_, { getState }) =>
  !getState().cart.mutationLoading;

export const fetchCart = createAsyncThunk(
  "cart/fetch",
  async (_, { rejectWithValue }) => {
    try {
      return await loadServerCart();
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to load your cart."),
      );
    }
  },
  {
    condition: (_, { getState }) =>
      getState().cart.serverStatus !== "loading",
  },
);

export const addCourseToCart = createAsyncThunk(
  "cart/addCourse",
  async (courseId, { rejectWithValue }) => {
    try {
      await addToCartApi(courseId);
      return await loadServerCart();
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to add this course to your cart."),
      );
    }
  },
  { condition: canMutateCart },
);

export const removeCourseFromCart = createAsyncThunk(
  "cart/removeCourse",
  async (courseId, { rejectWithValue }) => {
    try {
      await removeFromCartApi(courseId);
      return await loadServerCart();
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to remove this course from your cart."),
      );
    }
  },
  { condition: canMutateCart },
);

export const applyServerCoupon = createAsyncThunk(
  "cart/applyCoupon",
  async (couponCode, { rejectWithValue }) => {
    try {
      await applyCouponApi(couponCode);
      const cart = await loadServerCart();
      if (!cart.couponCode) {
        throw new Error("The server cart did not confirm the coupon.");
      }
      return cart;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to apply this coupon."),
      );
    }
  },
  { condition: canMutateCart },
);

export const removeServerCoupon = createAsyncThunk(
  "cart/removeCoupon",
  async (_, { rejectWithValue }) => {
    try {
      await removeCouponApi();
      const cart = await loadServerCart();
      if (cart.couponCode) {
        throw new Error("The server cart still contains a coupon.");
      }
      return cart;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to remove the coupon."),
      );
    }
  },
  { condition: canMutateCart },
);

const initialState = {
  items: [],
  coupon: null,
  serverCouponCode: null,
  serverTotals: null,
  serverStatus: "idle",
  serverError: null,
  mutationLoading: false,
  mutationError: null,
  activeRequestId: null,
  isCartOpen: false,
};

const applyServerCart = (state, cart) => {
  state.items = cart.items;
  state.serverTotals = cart.totals;
  state.serverCouponCode = cart.couponCode;
  state.coupon = null;
  state.serverStatus = "ready";
  state.serverError = null;
  state.mutationError = null;
};

const clearServerCartState = (state) => {
  state.items = [];
  state.serverCouponCode = null;
  state.serverTotals = null;
  state.serverStatus = "idle";
  state.serverError = null;
  state.mutationLoading = false;
  state.mutationError = null;
  state.activeRequestId = null;
};

const clearUserCartState = (state) => {
  state.items = [];
  state.coupon = null;
  state.serverCouponCode = null;
  state.serverTotals = null;
  state.serverStatus = "idle";
  state.serverError = null;
  state.mutationLoading = false;
  state.mutationError = null;
  state.activeRequestId = null;
  state.isCartOpen = false;
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    toggleCart: (state) => {
      state.isCartOpen = !state.isCartOpen;
    },
    setCartOpen: (state, action) => {
      state.isCartOpen = Boolean(action.payload);
    },
    clearServerCart: (state) => {
      clearServerCartState(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logout.pending, clearUserCartState)
      .addCase(login.fulfilled, clearUserCartState)
      .addCase(sessionExpired, clearUserCartState)
      .addCase(fetchSession.fulfilled, (state, action) => {
        if (!action.payload) clearUserCartState(state);
      })
      .addCase(fetchSession.rejected, (state, action) => {
        if (!action.meta.condition && action.payload?.status === 401) {
          clearUserCartState(state);
        }
      })
      .addCase(fetchCart.pending, (state, action) => {
        state.activeRequestId = action.meta.requestId;
        state.serverStatus = "loading";
        state.serverError = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        if (state.activeRequestId !== action.meta.requestId) return;
        applyServerCart(state, action.payload);
        state.activeRequestId = null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        if (action.meta.condition) return;
        if (state.activeRequestId !== action.meta.requestId) return;
        clearServerCartState(state);
        state.serverStatus = "error";
        state.serverError = action.payload || action.error.message;
      })
      .addMatcher(
        (action) =>
          [addCourseToCart, removeCourseFromCart, applyServerCoupon, removeServerCoupon]
            .some((thunk) => thunk.pending.match(action)),
        (state, action) => {
          state.activeRequestId = action.meta.requestId;
          state.mutationLoading = true;
          state.mutationError = null;
          state.serverStatus = "loading";
          state.serverError = null;
        },
      )
      .addMatcher(
        (action) =>
          [addCourseToCart, removeCourseFromCart, applyServerCoupon, removeServerCoupon]
            .some((thunk) => thunk.fulfilled.match(action)),
        (state, action) => {
          if (state.activeRequestId !== action.meta.requestId) return;
          applyServerCart(state, action.payload);
          state.mutationLoading = false;
          state.activeRequestId = null;
        },
      )
      .addMatcher(
        (action) =>
          [addCourseToCart, removeCourseFromCart, applyServerCoupon, removeServerCoupon]
            .some((thunk) => thunk.rejected.match(action)),
        (state, action) => {
          if (action.meta.condition) return;
          if (state.activeRequestId !== action.meta.requestId) return;
          clearServerCartState(state);
          state.serverStatus = "error";
          state.mutationError = action.payload || action.error.message;
          state.serverError = state.mutationError;
        },
      );
  },
});

export const {
  toggleCart,
  setCartOpen,
  clearServerCart,
} = cartSlice.actions;

export default cartSlice.reducer;
