package com.jobagent.repository;

import com.jobagent.model.CoverLetter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CoverLetterRepository extends JpaRepository<CoverLetter, Long> {
    List<CoverLetter> findAllByOrderByCreatedAtDesc();
    Optional<CoverLetter> findFirstByJobIdOrderByCreatedAtDesc(Long jobId);
}
