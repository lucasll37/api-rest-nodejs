import { it, beforeAll, afterAll, describe, expect, beforeEach } from 'vitest'
import { execSync } from 'child_process'
import request from 'supertest'
import { app } from '../src/app'


describe("Transactions routes", () => {
    
    beforeAll( async () => {
        await app.ready()
    })

    beforeEach( async () => {
        execSync('npm run knex migrate:rollback --all')
        execSync('npm run knex migrate:latest')
    })
    
    afterAll( async() => {
        await app.close()
    })
    
    it('should be able to create a new transaction', async () => {
        const response = await request(app.server)
            .post('/transactions')
            .send({
                title: 'New Transaction',
                amount: 5000,
                type: 'credit'
            })
            .expect(201)
    })

    it('should be able to list all transactions', async () => {
        const createTransactionResponse = await request(app.server)
        .post('/transactions')
        .send({
            title: 'New Transaction',
            amount: 5000,
            type: 'credit'
        })

        const cookies = createTransactionResponse.get('Set-Cookie')

        const listTransactionsResponse = await request(app.server)
            .get('/transactions')
            .set('Cookie', cookies)
            .expect(200)

        expect(listTransactionsResponse.body.transactions).toEqual([expect.objectContaining({
            title: 'New Transaction',
            amount: 5000
        })])
    })

    it('should be able to list a specific transaction', async () => {
        const createTransactionResponse = await request(app.server)
        .post('/transactions')
        .send({
            title: 'New Transaction',
            amount: 5000,
            type: 'credit'
        })

        const cookies = createTransactionResponse.get('Set-Cookie')

        const listTransactionsResponse = await request(app.server)
            .get('/transactions')
            .set('Cookie', cookies)
            .expect(200)

        const transactionId = listTransactionsResponse.body.transactions[0].id

        const getTransactionResponse = await request(app.server)
        .get(`/transactions/${transactionId}`)
        .set('Cookie', cookies)
        .expect(200) 

        expect(getTransactionResponse.body.transaction).toEqual(expect.objectContaining({
            title: 'New Transaction',
            amount: 5000
        }))
    })

    it('should be able to get the summary', async () => {
        const createTransactionResponse = await request(app.server)
        .post('/transactions')
        .send({
            title: 'New credit Transaction',
            amount: 5000,
            type: 'credit'
        })

        const cookies = createTransactionResponse.get('Set-Cookie')

        await request(app.server)
        .post('/transactions')
        .set('Cookie', cookies)
        .send({
            title: 'New debit Transaction',
            amount: 3000,
            type: 'debit'
        })

        const summaryResponse = await request(app.server)
            .get('/transactions/summary')
            .set('Cookie', cookies)
            .expect(200)

        expect(summaryResponse.body.summary).toEqual({amount: 2000})
    })

})