package com.jobagent.repository;

import com.jobagent.model.GkScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GkScoreRepository extends JpaRepository<GkScore, Long> {
    Optional<GkScore> findByUserIdentifier(String userIdentifier);
    Optional<GkScore> findByUserId(Long userId);
    List<GkScore> findTop10ByOrderByHighestScoreDesc();
}
