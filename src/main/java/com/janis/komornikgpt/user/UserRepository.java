package com.janis.komornikgpt.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u JOIN u.groups g WHERE g.id = :groupId")
    List<User> findAllByGroupId(@Param("groupId") Long groupId);

    @Query("SELECT DISTINCT u FROM User u JOIN u.groups g JOIN g.users u2 WHERE u2.id = :userId")
    List<User> findFriendsByUserId(@Param("userId") Long userId);
}
