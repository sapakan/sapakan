# sapakan

ActivityPub のサーバー間連合プロトコルが実装された簡素な SNS 実装（になる予定）

## 開発環境のセットアップ

PostgreSQL と Pleroma を用意するために Docker Compose が必要です。

### Pleroma の Docker image の準備

https://github.com/angristan/docker-pleroma から Dockerfile を拝借し、適当なディレクトリで Docker image を作成します。

```
$ docker build -t pleroma .
```

### sapakan のセットアップ

```
$ yarn install
$ docker build -t sapakan .
$ yarn dev:setup // Docker Compose による開発用 PostgreSQL の立ち上げおよび DB スキーマの適用
$ yarn dev:start // 実行
$ yarn dev:studio // Prisma Studio の実行
```

実行すると、5000 番に sapakan、5001 番に Pleroma が立ち上がります。

### Pleroma の管理者アカウントの作成

Pleroma のコンテナが実行されている状態で以下を実行し、`fakeadmin@pleroma.local` という管理者権限付きアカウントを作成します。

```
$ docker exec -it pleroma_web sh ./bin/pleroma_ctl user new fakeadmin admin@pleroma.localhost --admin
```

`y` を入力して Enter を押すとアカウントが作成されます。stdout の最後に URL が表示されるので、そこの FQDN を `pleroma.localhost:5001` などに変更してパスワードリセットを実施し、`localhost:5001` などから開けるフロントエンドを用いてログインしてください。

## テストの実行

テスト時には、Docker Compose を利用してデータベースの立ち上げを行います。

```
$ yarn install
$ yarn test
```
