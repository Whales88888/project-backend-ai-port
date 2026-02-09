# Backend & AI Portfolio

## 1. 概要
本リポジトリは、バックエンド開発および AI を活用した  
システム開発に関する学習成果と実装例をまとめたポートフォリオです。

REST API 設計、データ処理、機械学習モデルの統合を通じて、  
実運用を意識した安定性・保守性・拡張性を重視した  
バックエンド開発への理解を示しています。

---

## 2. 目的
バックエンドを中心としたシステム開発力を高め、  
業務で利用できる Web・API システムを構築できる  
エンジニアになることを目的としています。

本ポートフォリオでは、以下の点を重視しています。

- REST API の設計および実装
- Python を用いたバックエンド開発
- AI・データ処理をシステムとして組み込む視点
- フロントエンドと連携する API 設計
- シンプルで保守しやすいコード構成

---

## 3. プロジェクト一覧

### 3.1 AI Heart Disease Risk Prediction System
患者の健康データをもとに、心臓病の発症リスクを予測する  
バックエンド API システムです。

Flask による REST API と機械学習モデルを統合し、  
入力データの検証やエラーハンドリングを含めた  
安定した API 提供を目的として開発しました。

主な機能
- 健康データの入力（API 経由）
- 機械学習モデルによるリスク予測
- 予測結果の JSON 返却
- OCR 入力を想定したデータ処理設計

使用技術
- Python
- Flask
- scikit-learn（Random Forest）
- Pandas / NumPy
- REST API / JSON

学習ポイント
- 機械学習モデルを API として提供する設計
- 入力データの前処理とバリデーション
- エラー発生を想定した API 設計
- 実運用を意識した安定性と再現性の確保

---

### 3.2 Habit Tracker Web Application
日常の習慣を管理し、継続を支援することを目的とした  
フロントエンド中心の Web アプリケーションです。

サーバーを使用せず、ブラウザの localStorage を利用することで、  
軽量かつシンプルな構成を実現しました。

主な機能
- 習慣の登録・編集・削除
- 進捗状況の可視化
- カレンダー表示
- レスポンシブ対応（PC / スマートフォン）

使用技術
- HTML5 / CSS3
- JavaScript
- localStorage

学習ポイント
- フロントエンドアプリの基本構造
- DOM 操作とイベント処理
- クライアントサイドでのデータ管理
- UI/UX を意識した画面設計

---

### 3.3 Pet Care Management System
ペットクリニック業務を想定した  
管理用 Web システムのバックエンドを中心に開発したプロジェクトです。

ペット情報および飼い主情報を管理する CRUD 機能を実装し、  
業務システムを意識したデータ設計と API 構成を学びました。

主な機能
- ペット情報の登録・更新・削除
- 飼い主情報の管理
- REST API によるデータ操作

使用技術
- Python
- Flask
- REST API
- JSON

学習ポイント
- 業務システムを想定したデータ設計
- API エンドポイント設計
- バックエンドにおける責務分離
- 拡張を意識したシンプルな構成

---

## 4. 使用技術一覧
Backend / AI
- Python 3.x
- Flask
- scikit-learn
- Pandas

Frontend
- HTML / CSS
- JavaScript

その他
- Git / GitHub
- REST API
- JSON

---

## 5. ポートフォリオで示している価値
- バックエンド API 設計・実装の基礎力
- AI・データ処理をシステムとして組み込む視点
- 実運用を意識した安定性とエラーハンドリング
- フロントエンドと連携する API 設計の理解
- 保守性を意識したコード構成

---

## 6. 今後の展望
- クラウド環境へのデプロイ（AWS / GCP）
- 認証・認可（JWT など）
- CI/CD パイプライン
- モデル管理・運用
- パフォーマンス最適化

---

## 7. 連絡先
GitHub: https://github.com/Whales88888  
Email: whales.iluca@gmail.com  
Chatwork: https://www.chatwork.com/030805  

---

# Backend & AI Portfolio（Tiếng Việt）

## 1. Tổng quan
Repository này là portfolio tổng hợp các dự án và kết quả học tập  
liên quan đến phát triển backend và xây dựng hệ thống ứng dụng AI.

Thông qua thiết kế REST API, xử lý dữ liệu và tích hợp mô hình học máy,  
portfolio thể hiện tư duy phát triển hệ thống hướng tới  
tính ổn định, dễ bảo trì và khả năng mở rộng.

---

## 2. Mục tiêu
Tôi hướng tới trở thành kỹ sư tập trung vào backend,  
có khả năng xây dựng các hệ thống Web/API sử dụng trong thực tế.

---

## 3. Danh sách dự án
- Hệ thống dự đoán nguy cơ bệnh tim bằng AI  
- Ứng dụng Web theo dõi thói quen  
- Hệ thống quản lý chăm sóc thú cưng  

---

## 4. Công nghệ sử dụng
- Python / Flask
- scikit-learn / Pandas
- HTML / CSS / JavaScript
- REST API / JSON
- Git / GitHub

---

## 5. Định hướng tương lai
- Triển khai cloud
- Nâng cao backend & system design
- Học và áp dụng DevOps cơ bản
