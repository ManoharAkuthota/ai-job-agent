package com.jobagent.repository;

import com.jobagent.model.InterviewPrep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewPrepRepository extends JpaRepository<InterviewPrep, Long> {
    List<InterviewPrep> findAllByOrderByCreatedAtDesc();
    Optional<InterviewPrep> findFirstByJobIdOrderByCreatedAtDesc(Long jobId);
}
