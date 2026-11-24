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
                    Category.builder().name("Làm đẹp & Mỹ phẩm").slug("lam-dep-my-pham").description("Skincare, makeup, chăm sóc tóc và làm đẹp").build(),
                    Category.builder().name("Thời trang & Phối đồ").slug("thoi-trang-phoi-do").description("OOTD, mix & match, xu hướng thời trang").build(),
                    Category.builder().name("Ăn uống & Review món ngon").slug("an-uong-review").description("Ẩm thực đường phố, nhà hàng, công thức nấu ăn").build(),
                    Category.builder().name("Công nghệ & Tiện ích").slug("cong-nghe-tien-ich").description("Review điện thoại, laptop, mẹo công nghệ").build(),
                    Category.builder().name("Đời sống & Storytelling").slug("doi-song-storytelling").description("Góc nhìn cuộc sống, tâm sự, truyền cảm hứng").build()
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
