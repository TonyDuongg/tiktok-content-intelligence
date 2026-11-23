package com.tiktok.intelligence.config;

import com.tiktok.intelligence.domain.entity.Category;
import com.tiktok.intelligence.domain.entity.User;
import com.tiktok.intelligence.domain.enums.UserRole;
import com.tiktok.intelligence.repository.CategoryRepository;
import com.tiktok.intelligence.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedCategories();
        seedDefaultUser();
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

    private void seedDefaultUser() {
        if (!userRepository.existsByEmail("creator@example.com")) {
            log.info("Seeding default demo creator user (creator@example.com)...");
            User user = User.builder()
                    .email("creator@example.com")
                    .fullName("Creator Pro")
                    .passwordHash(passwordEncoder.encode("SecurePassword123@"))
                    .role(UserRole.ROLE_USER)
                    .creditsBalance(100)
                    .isActive(true)
                    .build();
            userRepository.save(user);
            log.info("Default creator user created with 100 credits.");
        }
    }
}
