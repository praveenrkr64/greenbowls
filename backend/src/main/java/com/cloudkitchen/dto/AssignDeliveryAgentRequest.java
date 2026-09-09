package com.cloudkitchen.dto;

// agentId may be null, which unassigns whichever agent the order currently has.
public class AssignDeliveryAgentRequest {
    private Long agentId;

    public Long getAgentId() { return agentId; }
    public void setAgentId(Long agentId) { this.agentId = agentId; }
}
