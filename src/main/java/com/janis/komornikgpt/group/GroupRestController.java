package com.janis.komornikgpt.group;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupRestController {
    private final GroupService groupService;

    @GetMapping
    public List<GroupDto> getAllGroups() {
        return groupService.findAll().stream()
                .map(GroupDto::fromGroup)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public GroupDto getGroupById(@PathVariable Long id) {
        Group group = groupService.findById(id);
        return GroupDto.fromGroup(group);
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
} 