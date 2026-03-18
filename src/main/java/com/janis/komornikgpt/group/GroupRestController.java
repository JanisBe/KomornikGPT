package com.janis.komornikgpt.group;

import com.janis.komornikgpt.exception.GroupNotFoundException;
import com.janis.komornikgpt.user.User;
import com.janis.komornikgpt.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Group", description = "Endpointy do zarządzania grupami wydatków")
public class GroupRestController {
    private final GroupService groupService;
    private final UserService userService;

    @GetMapping
    @Operation(summary = "Pobierz wszystkie grupy", description = "Zwraca listę wszystkich dostępnych grup.")
    public List<GroupDto> getAllGroups() {
        return groupService.findAll().stream()
                .map(GroupDto::fromGroup)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Pobierz grupę po ID", description = "Zwraca szczegóły wybranej grupy wraz z listą członków.")
    public GroupDto getGroupById(@PathVariable Long id, @RequestParam(required = false) String viewToken, Principal principal) {
        Group group = groupService.findById(id);
        if (group.isPublic() && viewToken != null && viewToken.equals(group.getViewToken())) {
            return GroupDto.fromGroup(group);
        }
        if (principal != null) {
            Long userId = extractUserId(principal);
            if (group.getUsers().stream().anyMatch(user -> user.getId().equals(userId))) {
                return GroupDto.fromGroup(group);
            }
        }

        throw new GroupNotFoundException("Nie znaleziono grupy lub nie masz dostępu do niej: " + id);
    }

    @PostMapping
    @Operation(summary = "Utwórz nową grupę", description = "Tworzy nową grupę wydatków na podstawie przekazanych danych.")
    public ResponseEntity<GroupDto> createGroup(@Valid @RequestBody CreateGroupRequest request) {
        Group createdGroup = groupService.createGroup(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(GroupDto.fromGroup(createdGroup));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Zaktualizuj grupę", description = "Aktualizuje dane dla grupy o podanym ID.")
    public GroupDto updateGroup(
            @PathVariable Long id,
            @Valid @RequestBody UpdateGroupRequest request) {
        Group updatedGroup = groupService.updateGroup(id, request);
        return GroupDto.fromGroup(updatedGroup);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Usuń grupę", description = "Usuwa grupę o podanym ID. Wymaga odpowiednich uprawnień.")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long id) {
        groupService.deleteGroup(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my")
    @Operation(summary = "Pobierz moje grupy", description = "Zwraca listę grup, do których należy obecnie zalogowany użytkownik.")
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