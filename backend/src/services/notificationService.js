export const sendStatusNotification = (userId, orderId, status) => {
  console.log(`[Notification] Order ${orderId} status changed to ${status} for User ${userId}`);
  // In a production app, we would send web push notifications or SMS here.
};
