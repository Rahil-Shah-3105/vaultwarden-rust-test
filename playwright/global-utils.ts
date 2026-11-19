import { expect, type Browser, type TestInfo } from '@playwright/test';
import { EventEmitter } from "events";
import { type Mail, MailServer } from 'maildev';
import { execSync } from 'node:child_process';

import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
const logger = console;

const fs = require("fs");
const { spawn } = require('node:child_process');

export function loadEnv(){
	logger.error('>>> Entering loadEnv()', { "event.action": "loadEnv" });
    var myEnv = dotenv.config({ path: 'test.env', quiet: true });
    dotenvExpand.expand(myEnv);

    return {
        user1: {
            email: process.env.TEST_USER_MAIL,
            name: process.env.TEST_USER,
            password: process.env.TEST_USER_PASSWORD,
        },
        user2: {
            email: process.env.TEST_USER2_MAIL,
            name: process.env.TEST_USER2,
            password: process.env.TEST_USER2_PASSWORD,
        },
        user3: {
            email: process.env.TEST_USER3_MAIL,
            name: process.env.TEST_USER3,
            password: process.env.TEST_USER3_PASSWORD,
        },
    }
	logger.warn('<<< Exiting loadEnv()', { "event.action": "loadEnv" });
}

export async function waitFor(url: String, browser: Browser) {
	logger.error(`>>> Entering waitFor(url=${url},browser=${browser})`, { "event.action": "waitFor", "logrite.url": url, "logrite.browser": browser });
    var ready = false;
    var context;
	logger.error(`waitFor(url=${url},browser=${browser}): ready → ${ready}`, { "event.action": "waitFor", "logrite.url": url, "logrite.browser": browser });

    do {
        try {
            context = await browser.newContext();
            const page = await context.newPage();
			logger.error(`waitFor(url=${url},browser=${browser}): context → ${context}`, { "event.action": "waitFor", "logrite.url": url, "logrite.browser": browser });
			logger.error(`waitFor(url=${url},browser=${browser}): page → ${page}`, { "event.action": "waitFor", "logrite.url": url, "logrite.browser": browser });
			logger.debug(`waitFor(url=${url},browser=${browser}): context → ${context}`, { "event.action": "waitFor", "logrite.url": url, "logrite.browser": browser });
            await page.waitForTimeout(500);
            const result = await page.goto(url);
			logger.error(`waitFor(url=${url},browser=${browser}): result → ${result}`, { "event.action": "waitFor", "logrite.url": url, "logrite.browser": browser });
            ready = result.status() === 200;
        } catch(e) {
			logger.error(`Exception in waitFor(url=${url},browser=${browser}): ${(e as Error).message}`, e, { "event.action": "waitFor", "event.category": "process", "logrite.url": url, "logrite.browser": browser });
            if( !e.message.includes("CONNECTION_REFUSED") ){
                throw e;
            }
        } finally {
            await context.close();
        }
    } while(!ready);
	logger.warn(`<<< Exiting waitFor(url=${url},browser=${browser})`, { "event.action": "waitFor", "logrite.url": url, "logrite.browser": browser });
}

export function startComposeService(serviceName: String){
	logger.error(`>>> Entering startComposeService(serviceName=${serviceName})`, { "event.action": "startComposeService", "logrite.serviceName": serviceName });
    console.log(`Starting ${serviceName}`);
    execSync(`docker compose --profile playwright --env-file test.env  up -d ${serviceName}`);
	logger.warn(`<<< Exiting startComposeService(serviceName=${serviceName})`, { "event.action": "startComposeService", "logrite.serviceName": serviceName });
}

export function stopComposeService(serviceName: String){
	logger.error(`>>> Entering stopComposeService(serviceName=${serviceName})`, { "event.action": "stopComposeService", "logrite.serviceName": serviceName });
    console.log(`Stopping ${serviceName}`);
    execSync(`docker compose --profile playwright --env-file test.env  stop ${serviceName}`);
	logger.warn(`<<< Exiting stopComposeService(serviceName=${serviceName})`, { "event.action": "stopComposeService", "logrite.serviceName": serviceName });
}

function wipeSqlite(){
	logger.error('>>> Entering wipeSqlite()', { "event.action": "wipeSqlite" });
    console.log(`Delete Vaultwarden container to wipe sqlite`);
    execSync(`docker compose --env-file test.env stop Vaultwarden`);
    execSync(`docker compose --env-file test.env rm -f Vaultwarden`);
	logger.warn('<<< Exiting wipeSqlite()', { "event.action": "wipeSqlite" });
}

async function wipeMariaDB(){
	logger.error('>>> Entering wipeMariaDB()', { "event.action": "wipeMariaDB" });
    var mysql = require('mysql2/promise');
    var ready = false;
	logger.error(`wipeMariaDB(): mysql → ${mysql}`, { "event.action": "wipeMariaDB" });
	logger.error(`wipeMariaDB(): ready → ${ready}`, { "event.action": "wipeMariaDB" });
    var connection;

    do {
        try {
            connection = await mysql.createConnection({
                user: process.env.MARIADB_USER,
                host: "127.0.0.1",
                database: process.env.MARIADB_DATABASE,
                password: process.env.MARIADB_PASSWORD,
                port: process.env.MARIADB_PORT,
            });

            await connection.execute(`DROP DATABASE ${process.env.MARIADB_DATABASE}`);
            await connection.execute(`CREATE DATABASE ${process.env.MARIADB_DATABASE}`);
            console.log('Successfully wiped mariadb');
            ready = true;
        } catch (err) {
            console.log(`Error when wiping mariadb: ${err}`);
        } finally {
            if( connection ){
                connection.end();
            }
        }
        await new Promise(r => setTimeout(r, 1000));
    } while(!ready);
	logger.warn('<<< Exiting wipeMariaDB()', { "event.action": "wipeMariaDB" });
}

async function wipeMysqlDB(){
	logger.error('>>> Entering wipeMysqlDB()', { "event.action": "wipeMysqlDB" });
    var mysql = require('mysql2/promise');
    var ready = false;
	logger.error(`wipeMysqlDB(): mysql → ${mysql}`, { "event.action": "wipeMysqlDB" });
	logger.error(`wipeMysqlDB(): ready → ${ready}`, { "event.action": "wipeMysqlDB" });
    var connection;

    do{
        try {
            connection = await mysql.createConnection({
                user: process.env.MYSQL_USER,
                host: "127.0.0.1",
                database: process.env.MYSQL_DATABASE,
                password: process.env.MYSQL_PASSWORD,
                port: process.env.MYSQL_PORT,
            });

            await connection.execute(`DROP DATABASE ${process.env.MYSQL_DATABASE}`);
            await connection.execute(`CREATE DATABASE ${process.env.MYSQL_DATABASE}`);
            console.log('Successfully wiped mysql');
            ready = true;
        } catch (err) {
            console.log(`Error when wiping mysql: ${err}`);
        } finally {
            if( connection ){
                connection.end();
            }
        }
        await new Promise(r => setTimeout(r, 1000));
    } while(!ready);
	logger.warn('<<< Exiting wipeMysqlDB()', { "event.action": "wipeMysqlDB" });
}

async function wipePostgres(){
	logger.error('>>> Entering wipePostgres()', { "event.action": "wipePostgres" });
    const { Client } = require('pg');

    const client = new Client({
        user: process.env.POSTGRES_USER,
        host: "127.0.0.1",
        database: "postgres",
        password: process.env.POSTGRES_PASSWORD,
        port: process.env.POSTGRES_PORT,
    });

	logger.error(`wipePostgres(): Client → ${Client}`, { "event.action": "wipePostgres" });
	logger.error(`wipePostgres(): client → ${client}`, { "event.action": "wipePostgres" });
    try {
        await client.connect();
        await client.query(`DROP DATABASE ${process.env.POSTGRES_DB}`);
        await client.query(`CREATE DATABASE ${process.env.POSTGRES_DB}`);
        console.log('Successfully wiped postgres');
    } catch (err) {
        console.log(`Error when wiping postgres: ${err}`);
    } finally {
        client.end();
		logger.warn('<<< Exiting wipePostgres()', { "event.action": "wipePostgres" });
    }
}

function dbConfig(testInfo: TestInfo){
	logger.error(`>>> Entering dbConfig(testInfo=${testInfo})`, { "event.action": "dbConfig", "logrite.testInfo": testInfo });
    switch(testInfo.project.name) {
        case "postgres":
        case "sso-postgres":
            return { DATABASE_URL: `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@127.0.0.1:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}` };
        case "mariadb":
        case "sso-mariadb":
            return { DATABASE_URL: `mysql://${process.env.MARIADB_USER}:${process.env.MARIADB_PASSWORD}@127.0.0.1:${process.env.MARIADB_PORT}/${process.env.MARIADB_DATABASE}` };
        case "mysql":
        case "sso-mysql":
            return { DATABASE_URL: `mysql://${process.env.MYSQL_USER}:${process.env.MYSQL_PASSWORD}@127.0.0.1:${process.env.MYSQL_PORT}/${process.env.MYSQL_DATABASE}`};
        case "sqlite":
        case "sso-sqlite":
            return { I_REALLY_WANT_VOLATILE_STORAGE: true };
        default:
	logger.warn(`<<< Exiting dbConfig(testInfo=${testInfo})`, { "event.action": "dbConfig", "logrite.testInfo": testInfo });
            throw new Error(`Unknow database name: ${testInfo.project.name}`);
    }
}

/**
 *  All parameters passed in `env` need to be added to the docker-compose.yml
 **/
export async function startVault(browser: Browser, testInfo: TestInfo, env = {}, resetDB: Boolean = true) {
	logger.error(`>>> Entering startVault(browser=${browser},testInfo=${testInfo},env=${env},resetDB=${resetDB})`, { "event.action": "startVault", "logrite.browser": browser, "logrite.testInfo": testInfo, "logrite.resetDB": resetDB });
    if( resetDB ){
        switch(testInfo.project.name) {
            case "postgres":
            case "sso-postgres":
                await wipePostgres();
                break;
            case "mariadb":
            case "sso-mariadb":
                await wipeMariaDB();
                break;
            case "mysql":
            case "sso-mysql":
                await wipeMysqlDB();
                break;
            case "sqlite":
            case "sso-sqlite":
                wipeSqlite();
                break;
            default:
                throw new Error(`Unknow database name: ${testInfo.project.name}`);
        }
    }

    console.log(`Starting Vaultwarden`);
    execSync(`docker compose --profile playwright --env-file test.env up -d Vaultwarden`, {
        env: { ...env, ...dbConfig(testInfo) },
    });
    await waitFor("/", browser);
    console.log(`Vaultwarden running on: ${process.env.DOMAIN}`);
	logger.warn(`<<< Exiting startVault(browser=${browser},testInfo=${testInfo},env=${env},resetDB=${resetDB})`, { "event.action": "startVault", "logrite.browser": browser, "logrite.testInfo": testInfo, "logrite.resetDB": resetDB });
}

export async function stopVault(force: boolean = false) {
	logger.error(`>>> Entering stopVault(force=${force})`, { "event.action": "stopVault", "logrite.force": force });
    if( force === false && process.env.PW_KEEP_SERVICE_RUNNING === "true" ) {
        console.log(`Keep vaultwarden running on: ${process.env.DOMAIN}`);
    } else {
        console.log(`Vaultwarden stopping`);
        execSync(`docker compose --profile playwright --env-file test.env stop Vaultwarden`);
		logger.warn(`<<< Exiting stopVault(force=${force})`, { "event.action": "stopVault", "logrite.force": force });
    }
}

export async function restartVault(page: Page, testInfo: TestInfo, env, resetDB: Boolean = true) {
	logger.error(`>>> Entering restartVault(page=${page},testInfo=${testInfo},env=${env},resetDB=${resetDB})`, { "event.action": "restartVault", "logrite.page": page, "logrite.testInfo": testInfo, "logrite.resetDB": resetDB });
    stopVault(true);
	logger.warn(`<<< Exiting restartVault(page=${page},testInfo=${testInfo},env=${env},resetDB=${resetDB})`, { "event.action": "restartVault", "logrite.page": page, "logrite.testInfo": testInfo, "logrite.resetDB": resetDB });
    return startVault(page.context().browser(), testInfo, env, resetDB);
}

export async function checkNotification(page: Page, hasText: string) {
	logger.error(`>>> Entering checkNotification(page=${page},hasText=${hasText})`, { "event.action": "checkNotification", "logrite.page": page, "logrite.hasText": hasText });
    await expect(page.locator('bit-toast', { hasText })).toBeVisible();
    try {
        await page.locator('bit-toast', { hasText }).getByRole('button', { name: 'Close' }).click({force: true, timeout: 10_000});
    } catch (error) {
        console.log(`Closing notification failed but it should now be invisible (${error})`);
    }
    await expect(page.locator('bit-toast', { hasText })).toHaveCount(0);
	logger.warn(`<<< Exiting checkNotification(page=${page},hasText=${hasText})`, { "event.action": "checkNotification", "logrite.page": page, "logrite.hasText": hasText });
}

export async function cleanLanding(page: Page) {
	logger.error(`>>> Entering cleanLanding(page=${page})`, { "event.action": "cleanLanding", "logrite.page": page });
    await page.context().clearCookies();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button').nth(0)).toBeVisible();

    const logged = await page.getByRole('button', { name: 'Log out' }).count();
	logger.error(`cleanLanding(page=${page}): logged → ${logged}`, { "event.action": "cleanLanding", "logrite.page": page });
    if( logged > 0 ){
        await page.getByRole('button', { name: 'Log out' }).click();
        await page.getByRole('button', { name: 'Log out' }).click();
		logger.warn(`<<< Exiting cleanLanding(page=${page})`, { "event.action": "cleanLanding", "logrite.page": page });
    }
}

export async function logout(test: Test, page: Page, user: { name: string }) {
	logger.error(`>>> Entering logout(test=${test},page=${page},user=${user})`, { "event.action": "logout", "logrite.test": test, "logrite.page": page, "user.name": String(user) });
    await test.step('logout', async () => {
        await page.getByRole('button', { name: user.name, exact: true }).click();
        await page.getByRole('menuitem', { name: 'Log out' }).click();
        await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
    });
	logger.warn(`<<< Exiting logout(test=${test},page=${page},user=${user})`, { "event.action": "logout", "logrite.test": test, "logrite.page": page, "user.name": String(user) });
}
