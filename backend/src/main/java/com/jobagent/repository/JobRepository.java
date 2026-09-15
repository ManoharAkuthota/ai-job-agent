package com.jobagent.repository;

import com.jobagent.model.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
    List<Job> findByUrl(String url);
    List<Job> findByStatusOrderByDiscoveredAtDesc(String status);
    List<Job> findAllByOrderByDiscoveredAtDesc();
    List<Job> findAllByOrderByMatchScoreDesc();
    List<Job> findByMatchScoreGreaterThanEqualOrderByMatchScoreDesc(Integer minScore);

    // Strict Freshness Filtering (Within 7 Days)
    List<Job> findAllByDiscoveredAtAfterOrderByMatchScoreDesc(java.time.LocalDateTime cutoff);
    List<Job> findByStatusAndDiscoveredAtAfterOrderByDiscoveredAtDesc(String status, java.time.LocalDateTime cutoff);
    List<Job> findByMatchScoreGreaterThanEqualAndDiscoveredAtAfterOrderByMatchScoreDesc(Integer minScore, java.time.LocalDateTime cutoff);

    @Query("SELECT COUNT(j) FROM Job j WHERE j.status = :status")
    long countByStatus(String status);
}
