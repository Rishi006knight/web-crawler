package com.ssn.webcrawler.model;

public class FailedUrlInfo {
    private String url;
    private String reason;
    private int statusCode;
    private int retryCount;
    private long timestamp;

    public FailedUrlInfo() {}

    public FailedUrlInfo(String url, String reason, int statusCode, int retryCount) {
        this.url = url;
        this.reason = reason;
        this.statusCode = statusCode;
        this.retryCount = retryCount;
        this.timestamp = System.currentTimeMillis();
    }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public int getStatusCode() { return statusCode; }
    public void setStatusCode(int statusCode) { this.statusCode = statusCode; }

    public int getRetryCount() { return retryCount; }
    public void setRetryCount(int retryCount) { this.retryCount = retryCount; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
