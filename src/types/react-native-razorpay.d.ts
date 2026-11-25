declare module 'react-native-razorpay' {
  export type RazorpaySuccessResponse = {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  };

  export type RazorpayErrorResponse = {
    code: number | string;
    description: string;
  };

  type RazorpayCheckout = {
    open: (options: Record<string, unknown>) => Promise<RazorpaySuccessResponse>;
  };

  const checkout: RazorpayCheckout;
  export default checkout;
}
