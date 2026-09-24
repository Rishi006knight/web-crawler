package com.ssn.webcrawler.model;

public class CrawlAttempt {
    private String url;
    private String outcome;
    private Integer httpStatus;
    private String reason;
    private long durationMillis;

    public CrawlAttempt() {
    }

    public CrawlAttempt(String url, String outcome, Integer httpStatus, String reason, long durationMillis) {
        this.url = url;
        this.outcome = outcome;
        this.httpStatus = httpStatus;
        this.reason = reason;
        this.durationMillis = durationMillis;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getOutcome() {
        return outcome;
    }

    public void setOutcome(String outcome) {
        this.outcome = outcome;
    }

    public Integer getHttpStatus() {
        return httpStatus;
    }

    public void setHttpStatus(Integer httpStatus) {
        this.httpStatus = httpStatus;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public long getDurationMillis() {
        return durationMillis;
    }

    public void setDurationMillis(long durationMillis) {
        this.durationMillis = durationMillis;
    }
}
