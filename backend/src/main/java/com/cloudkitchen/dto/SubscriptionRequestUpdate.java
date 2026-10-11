package com.cloudkitchen.dto;

import jakarta.validation.constraints.Size;

// Admin-only: record the outcome of the call.
public class SubscriptionRequestUpdate {

    private String status;

    @Size(max = 1000, message = "Notes must be 1000 characters or fewer")
    private String notes;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
