@echo off
chcp 65001 >nul
echo Dang tat cac container Docker...
docker compose -f docker/docker-compose.yml down
echo Da tat ha tang Docker thanh cong!
