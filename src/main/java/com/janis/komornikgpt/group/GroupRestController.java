package com.janis.komornikgpt.group;

import com.janis.komornikgpt.exception.GroupNotFoundException;
import com.janis.komornikgpt.user.User;
import com.janis.komornikgpt.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupRestController {
    private final GroupService groupService;
    private final UserService userService;

    @GetMapping
    public List<GroupDto> getAllGroups() {
        return groupService.findAll().stream()
                .map(GroupDto::fromGroup)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public GroupDto getGroupById(@PathVariable Long id, Principal principal) {
        Group group = groupService.findById(id);
        if (group.isPublic()) {
            return GroupDto.fromGroup(group);
        }
        Long userId = extractUserId(principal);
        if (group.getUsers().stream().filter(user -> user.getId().equals(userId)).findAny().isEmpty()) {
            throw new GroupNotFoundException("Nie należysz do tej grupy: " + id);
        } else {
            return GroupDto.fromGroup(group);
        }
    }

    @PostMapping
    public ResponseEntity<GroupDto> createGroup(@Valid @RequestBody CreateGroupRequest request) {
        Group createdGroup = groupService.createGroup(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(GroupDto.fromGroup(createdGroup));
    }

    @PutMapping("/{id}")
    public GroupDto updateGroup(
            @PathVariable Long id,
            @Valid @RequestBody UpdateGroupRequest request) {
        Group updatedGroup = groupService.updateGroup(id, request);
        return GroupDto.fromGroup(updatedGroup);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long id) {
        groupService.deleteGroup(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my")
    public List<GroupDto> getMyGroups() {
        return groupService.findGroupsForCurrentUser().stream()
                .map(GroupDto::fromGroup)
                .collect(Collectors.toList());
    }

    private Long extractUserId(Principal principal) {
        if (principal instanceof UsernamePasswordAuthenticationToken authToken) {
            Object userObj = authToken.getPrincipal();
            if (userObj instanceof User user) {
                return user.getId();
            }
        } else if (principal instanceof OAuth2AuthenticationToken oauthToken) {
            OAuth2User oauthUser = oauthToken.getPrincipal();

            String email = oauthUser.getAttribute("email");

            return userService.findByEmail(email).getId();
        }
        return null;

    }
}