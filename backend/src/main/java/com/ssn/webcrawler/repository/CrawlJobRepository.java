package com.ssn.webcrawler.repository;

import com.ssn.webcrawler.entity.CrawlJobEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CrawlJobRepository extends JpaRepository<CrawlJobEntity, String> {
    Optional<CrawlJobEntity> findFirstByOrderByStartTimeDesc();
}
