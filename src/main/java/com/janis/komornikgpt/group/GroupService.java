package com.janis.komornikgpt.group;

import com.janis.komornikgpt.user.User;
import com.janis.komornikgpt.user.UserRepository;
import lombok.RequiredArgsConstructor;
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
        Group group = new Group();
        group.setName(request.name());
        
        List<User> users = userRepository.findAllById(request.userIds());
        if (users.size() != request.userIds().size()) {
            throw new RuntimeException("Some users not found");
        }
        
        group.setUsers(users);
        return groupRepository.save(group);
    }

    @Transactional
    public Group updateGroup(Long id, UpdateGroupRequest request) {
        Group group = findById(id);

        if (request.name() != null) {
            group.setName(request.name());
        }

        if (request.userIds() != null) {
            List<User> users = userRepository.findAllById(request.userIds());
            if (users.size() != request.userIds().size()) {
                throw new RuntimeException("Some users not found");
            }
            group.setUsers(users);
        }

        return groupRepository.save(group);
    }

    @Transactional
    public void deleteGroup(Long id) {
        if (!groupRepository.existsById(id)) {
            throw new GroupNotFoundException("Group not found with id: " + id);
        }
        groupRepository.deleteById(id);
    }
} 