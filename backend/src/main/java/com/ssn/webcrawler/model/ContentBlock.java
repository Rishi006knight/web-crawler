package com.ssn.webcrawler.model;

public class ContentBlock {
    private String tag;     // h1, h2, h3, p, li, blockquote, pre
    private String type;    // HEADING, PARAGRAPH, LIST_ITEM, QUOTE, CODE
    private String text;

    public ContentBlock() {
    }

    public ContentBlock(String tag, String type, String text) {
        this.tag = tag;
        this.type = type;
        this.text = text;
    }

    public String getTag() {
        return tag;
    }

    public void setTag(String tag) {
        this.tag = tag;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }
}
