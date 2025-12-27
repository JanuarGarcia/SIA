/**
 * Get the display category for a ticket
 * If category is "Other" and customCategory exists in requestDetails, use customCategory
 * Otherwise, use the category as-is
 */
export const getDisplayCategory = (ticket) => {
  if (!ticket) return 'N/A';
  
  // If category is "Other" and we have a custom category in requestDetails (for backward compatibility)
  if (ticket.category === 'Other' && ticket.requestDetails?.customCategory) {
    return ticket.requestDetails.customCategory;
  }
  
  // Otherwise, use the category directly (which will be the custom category for new tickets)
  return ticket.category;
};

