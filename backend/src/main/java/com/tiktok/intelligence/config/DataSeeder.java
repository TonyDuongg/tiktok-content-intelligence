package com.tiktok.intelligence.config;

import com.tiktok.intelligence.domain.entity.Category;
import com.tiktok.intelligence.domain.entity.User;
import com.tiktok.intelligence.domain.enums.UserRole;
import com.tiktok.intelligence.repository.CategoryRepository;
import com.tiktok.intelligence.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        seedCategories();
        seedWorkspaceOwner();
    }

    private void seedCategories() {
        if (categoryRepository.count() == 0) {
            log.info("Seeding initial TikTok categories...");
            List<Category> categories = List.of(
                    Category.builder().name("Beauty & cosmetics").slug("lam-dep-my-pham").description("Skincare, makeup, hair care and beauty").build(),
                    Category.builder().name("Fashion & styling").slug("thoi-trang-phoi-do").description("OOTD, styling and fashion trends").build(),
                    Category.builder().name("Food & reviews").slug("an-uong-review").description("Street food, restaurants and recipes").build(),
                    Category.builder().name("Technology & gadgets").slug("cong-nghe-tien-ich").description("Phone and laptop reviews, technology tips").build(),
                    Category.builder().name("Lifestyle & storytelling").slug("doi-song-storytelling").description("Life stories, personal experiences and inspiration").build()
            );
            categoryRepository.saveAll(categories);
            log.info("Seeded {} categories successfully.", categories.size());
        }
    }

    private void seedWorkspaceOwner() {
        if (!userRepository.existsByEmail(WorkspaceIdentity.OWNER_EMAIL)) {
            log.info("Creating storage owner for the shared workspace...");
            User user = User.builder()
                    .email(WorkspaceIdentity.OWNER_EMAIL)
                    .fullName("Creator Studio")
                    .passwordHash("{disabled}")
                    .role(UserRole.ROLE_USER)
                    .creditsBalance(100)
                    .isActive(true)
                    .build();
            userRepository.save(user);
            log.info("Shared workspace storage owner created.");
        }
    }
}
