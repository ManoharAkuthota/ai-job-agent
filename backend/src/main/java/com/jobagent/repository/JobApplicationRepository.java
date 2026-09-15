package com.jobagent.repository;

import com.jobagent.model.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    Optional<JobApplication> findByJobId(Long jobId);
    List<JobApplication> findAllByOrderByAppliedAtDesc();
    long countByStatus(String status);
}
