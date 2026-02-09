# AI Heart Disease Risk Prediction System

## 概要
本プロジェクトは、患者の健康データをもとに心臓病の発症リスクを予測する
バックエンド中心の AI システムです。
機械学習を業務支援に活用し、意思決定をサポートすることを目的としています。

## 目的
年齢・血圧・コレステロールなどの医療データを入力とし、
心臓病のリスクを数値として可視化することで、
早期発見および判断支援につなげることを目指しました。

## システム構成
- バックエンド：Flask（REST API）
- AI / ML：scikit-learn（Random Forest）
- データセット：UCI Heart Disease Dataset
- フロントエンド / モバイルから API 経由で利用可能

## 実装内容
- 入力データのバリデーションおよびエラーハンドリング
- 複数モデルを比較し、精度と安定性を考慮してモデルを選定
- JSON ベースの API 設計により再利用性を重視
- OCR 入力・チャット形式入力によるユーザー負荷軽減

## 工夫点
モデル精度だけでなく、レスポンス速度・再現性・保守性を意識し、
実運用を想定したシンプルで安定した構成を心がけました。

# Hệ thống dự đoán rủi ro bệnh tim bằng AI

## Tổng quan
Dự án này là một hệ thống AI tập trung vào backend, sử dụng dữ liệu sức khỏe của bệnh nhân
để dự đoán nguy cơ mắc bệnh tim.
Mục tiêu là ứng dụng máy học vào hỗ trợ nghiệp vụ và hỗ trợ ra quyết định trong thực tế.

## Mục tiêu
Hệ thống nhận đầu vào là các thông tin y tế như độ tuổi, huyết áp, cholesterol…  
Sau đó, nguy cơ mắc bệnh tim được dự đoán và biểu diễn dưới dạng số liệu,
giúp hỗ trợ phát hiện sớm và đưa ra quyết định kịp thời.

## Kiến trúc hệ thống
- Backend: Flask (REST API)
- AI / Machine Learning: scikit-learn (Random Forest)
- Dataset: UCI Heart Disease Dataset
- Có thể được sử dụng từ frontend hoặc ứng dụng di động thông qua API

## Nội dung triển khai
- Kiểm tra dữ liệu đầu vào và xử lý lỗi để đảm bảo hệ thống hoạt động ổn định
- So sánh nhiều mô hình học máy, lựa chọn mô hình cân bằng giữa độ chính xác và tính ổn định
- Thiết kế API theo chuẩn JSON, chú trọng khả năng tái sử dụng
- Hỗ trợ nhập dữ liệu bằng OCR và giao diện nhập liệu dạng hội thoại nhằm giảm thao tác cho người dùng

## Điểm nổi bật
Không chỉ tập trung vào độ chính xác của mô hình,
hệ thống còn chú trọng đến tốc độ phản hồi, khả năng tái hiện kết quả và tính dễ bảo trì,
với mục tiêu hướng đến việc triển khai trong môi trường thực tế.
