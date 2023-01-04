# sapakan

ActivityPub のサーバー間連合プロトコルが実装された簡素な SNS 実装（になる予定）

## 開発環境のセットアップ

PostgreSQL を用意するために Docker Compose が必要です。

```
$ yarn install
$ yarn dev:setup // Docker Compose による開発用 PostgreSQL の立ち上げおよび DB スキーマの適用
$ yarn dev:start // 実行
$ yarn dev:studio // Prisma Studio の実行
```

## テストの実行

テスト時には、Docker Compose を利用してデータベースの立ち上げを行います。

```
$ yarn install
$ yarn test
```