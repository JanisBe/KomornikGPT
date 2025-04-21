package com.janis.komornikgpt.group;

import com.janis.komornikgpt.user.User;
import com.janis.komornikgpt.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupService {
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    public List<Group> findAll() {
        return groupRepository.findAll();
    }

    public Group findById(Long id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new GroupNotFoundException("Group not found with id: " + id));
    }

    @Transactional
    public Group createGroup(CreateGroupRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User creator = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Creator not found"));

        Group group = new Group();
        group.setName(request.name());
        group.setCreatedBy(creator);
        
        List<User> users = userRepository.findAllById(request.userIds());
        if (users.size() != request.userIds().size()) {
            throw new RuntimeException("Some users not found");
        }

        // Make sure creator is in the group
        if (!users.contains(creator)) {
            users.add(creator);
        }
        
        group.setUsers(users);
        return groupRepository.save(group);
    }

    @Transactional
    public Group updateGroup(Long id, UpdateGroupRequest request) {
        Group group = findById(id);
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Only creator can update the group
        if (!group.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only the creator can update the group");
        }

        if (request.name() != null) {
            group.setName(request.name());
        }

        if (request.userIds() != null) {
            List<User> users = userRepository.findAllById(request.userIds());
            if (users.size() != request.userIds().size()) {
                throw new RuntimeException("Some users not found");
            }

            // Make sure creator stays in the group
            if (!users.contains(group.getCreatedBy())) {
                users.add(group.getCreatedBy());
            }
            
            group.setUsers(users);
        }

        return groupRepository.save(group);
    }

    @Transactional
    public void deleteGroup(Long id) {
        Group group = findById(id);
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Only creator can delete the group
        if (!group.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only the creator can delete the group");
        }

        groupRepository.delete(group);
    }
} 