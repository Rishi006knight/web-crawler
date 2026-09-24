package com.ssn.webcrawler.repository;

import com.ssn.webcrawler.entity.PageDataEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PageDataRepository extends JpaRepository<PageDataEntity, Long> {
    List<PageDataEntity> findByJob_JobId(String jobId);
}
