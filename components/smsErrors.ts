const messages: Record<string, string> = {
  not_signed_in: "Please sign in again.",
  no_active_subscription: "Your subscription isn't active.",
  not_connected: "Connect QuickBooks first.",
  customer_not_found: "This customer is no longer in QuickBooks.",
  no_phone: "No phone number on file for this customer.",
  no_overdue_with_phone:
    "No overdue customers with phone numbers to text right now.",
  send_failed: "SMS failed. Please try again.",
};

export function smsErrorMessage(code: string): string {
  return messages[code] ?? "Couldn't send. Please try again.";
}
