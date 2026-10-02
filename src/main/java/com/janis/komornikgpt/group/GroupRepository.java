package com.janis.komornikgpt.group;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {

    @Override
    @EntityGraph(attributePaths = {"users", "createdBy"})
    List<Group> findAll();

    @Override
    @EntityGraph(attributePaths = {"users", "createdBy"})
    Optional<Group> findById(Long id);

    @EntityGraph(attributePaths = {"users", "createdBy"})
    List<Group> findByUsers_Id(Long userId);
}
