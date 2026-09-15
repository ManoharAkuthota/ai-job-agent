package com.jobagent.repository;

import com.jobagent.model.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
    Optional<Job> findByUrl(String url);
    List<Job> findByStatusOrderByDiscoveredAtDesc(String status);
    List<Job> findAllByOrderByDiscoveredAtDesc();
    List<Job> findByMatchScoreGreaterThanEqualOrderByMatchScoreDesc(Integer minScore);

    @Query("SELECT COUNT(j) FROM Job j WHERE j.status = :status")
    long countByStatus(String status);
}
