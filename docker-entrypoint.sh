#!/bin/sh

while ! pg_isready -U sapakan_dev -d postgres://test_db:5432/sapakan_development -t 1; do
    sleep 1s
done

yarn prisma db push
yarn start
