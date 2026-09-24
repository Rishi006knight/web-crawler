package com.ssn.webcrawler.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class CrawlStreamService {

    private static final Logger log = LoggerFactory.getLogger(CrawlStreamService.class);
    private final Map<String, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String jobId) {
        // 10 minutes timeout for stream
        SseEmitter emitter = new SseEmitter(10 * 60 * 1000L);
        emitters.computeIfAbsent(jobId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(jobId, emitter));
        emitter.onTimeout(() -> removeEmitter(jobId, emitter));
        emitter.onError((e) -> removeEmitter(jobId, emitter));

        try {
            emitter.send(SseEmitter.event().name("connected").data(Map.of("jobId", jobId, "status", "CONNECTED")));
        } catch (IOException e) {
            removeEmitter(jobId, emitter);
        }

        return emitter;
    }

    public void emit(String jobId, String eventName, Object data) {
        List<SseEmitter> jobEmitters = emitters.get(jobId);
        if (jobEmitters == null || jobEmitters.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : jobEmitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (Exception e) {
                removeEmitter(jobId, emitter);
            }
        }
    }

    public void complete(String jobId) {
        List<SseEmitter> jobEmitters = emitters.remove(jobId);
        if (jobEmitters != null) {
            for (SseEmitter emitter : jobEmitters) {
                try {
                    emitter.complete();
                } catch (Exception ignored) {}
            }
        }
    }

    private void removeEmitter(String jobId, SseEmitter emitter) {
        List<SseEmitter> list = emitters.get(jobId);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) {
                emitters.remove(jobId);
            }
        }
    }
}
