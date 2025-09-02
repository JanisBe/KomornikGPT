package com.janis.komornikgpt.group;

import com.janis.komornikgpt.exception.GroupNotFoundException;
import com.janis.komornikgpt.mail.EmailService;
import com.janis.komornikgpt.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GroupService {
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final EmailService emailService;

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
        group.setDescription(request.description());
        group.setCreatedBy(creator);
        group.setPublic(request.isPublic());
        if (request.isPublic()) {
            group.setViewToken(UUID.randomUUID().toString().substring(0, 8));
        }
        group.setDefaultCurrency(request.defaultCurrency());
        List<User> users = new ArrayList<>();

        // Process each member request
        for (CreateGroupRequest.MemberRequest memberRequest : request.members()) {
            User user;
            if (memberRequest.userId() != null) {
                // Existing user
                user = userRepository.findById(memberRequest.userId())
                        .orElseThrow(() -> new RuntimeException("User not found with id: " + memberRequest.userId()));
            } else {
                // Create new user
                CreateUserWithoutPasswordRequest createUserRequest = new CreateUserWithoutPasswordRequest(
                        memberRequest.userName(),
                        "", // Empty surname for now
                        memberRequest.userName(), // Using userName as username
                        memberRequest.email());
                UserCreationResult userResult = userService.createUserWithoutPassword(createUserRequest);
                user = userResult.user();
                if (userResult.isNewUser()) {
                    emailService.sendGroupInvitationAndSetPasswordEmail(user.getEmail(), request.name(), creator.getUsername(), userResult.verificationToken());
                } else {
                    emailService.sendGroupInvitationEmail(user.getEmail(), request.name(), creator.getUsername(), group.getId());
                }
            }
            users.add(user);
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
        if (request.defaultCurrency() != null) {
            group.setDefaultCurrency(request.defaultCurrency());
        }
        if (request.description() != null) {
            group.setDescription(request.description());
        }
        group.setPublic(request.isPublic());
        if (request.isPublic()) {
            group.setViewToken(UUID.randomUUID().toString().substring(0, 8));
        }
        if (request.members() != null) {
            List<User> users = new ArrayList<>();
            for (UpdateGroupRequest.MemberRequest memberRequest : request.members()) {
                User user;
                if (memberRequest.userId() != null) {
                    // Existing user
                    user = userRepository.findById(memberRequest.userId())
                            .orElseThrow(
                                    () -> new RuntimeException("User not found with id: " + memberRequest.userId()));
                } else {
                    // Create new user
                    CreateUserWithoutPasswordRequest createUserRequest = new CreateUserWithoutPasswordRequest(
                            memberRequest.userName(),
                            "", // Empty surname for now
                            memberRequest.userName(), // Using userName as username
                            memberRequest.email());
                    UserCreationResult userResult = userService.createUserWithoutPassword(createUserRequest);
                    user = userResult.user();
                    // For existing groups, we assume invitation email is always sent if a new member is added
                    if (userResult.isNewUser()) {
                        emailService.sendGroupInvitationAndSetPasswordEmail(user.getEmail(), group.getName(), currentUser.getUsername(), userResult.verificationToken());
                    } else {
                        emailService.sendGroupInvitationEmail(user.getEmail(), group.getName(), currentUser.getUsername(), group.getId());
                    }
                }
                users.add(user);
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

    public boolean isUserMemberOfGroup(String username, Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupNotFoundException("Group not found with id: " + groupId));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));

        return group.getUsers().stream()
                .anyMatch(member -> member.getId().equals(user.getId()));
    }

    public List<Group> findGroupsForCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return groupRepository.findByUsers_Id(user.getId());
    }

    public boolean checkViewToken(Long groupId, String viewToken) {
        return groupRepository.findById(groupId)
                .map(group -> group.getViewToken().equals(viewToken))
                .orElse(false);
    }
}