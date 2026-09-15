package com.jobagent.repository;

import com.jobagent.model.AgentSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AgentSettingsRepository extends JpaRepository<AgentSettings, Long> {
}
