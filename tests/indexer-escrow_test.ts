import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

Clarinet.test({
    name: "Indexer Escrow: Create Indexing Task",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const indexer = accounts.get('wallet_1')!;
        const requester = accounts.get('wallet_2')!;

        // Test creating an indexing task with valid parameters
        let block = chain.mineBlock([
            Tx.contractCall('indexer-escrow', 'create-session', 
                [types.principal(indexer.address), types.uint(1000000)], 
                requester.address)
        ]);

        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        block.receipts[0].result.expectOk();
    }
});

Clarinet.test({
    name: "Indexer Escrow: Task Completion Workflow",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const indexer = accounts.get('wallet_1')!;
        const requester = accounts.get('wallet_2')!;

        // Create a session
        let block = chain.mineBlock([
            Tx.contractCall('indexer-escrow', 'create-session', 
                [types.principal(indexer.address), types.uint(1000000)], 
                requester.address)
        ]);

        // Extract session ID
        const sessionId = block.receipts[0].result.expectOk().replace('u', '');

        // Confirm session completion
        block = chain.mineBlock([
            Tx.contractCall('indexer-escrow', 'confirm-session-completion', 
                [types.uint(sessionId)], 
                requester.address),
            Tx.contractCall('indexer-escrow', 'confirm-session-completion', 
                [types.uint(sessionId)], 
                indexer.address)
        ]);

        assertEquals(block.receipts.length, 2);
        block.receipts[0].result.expectOk();
        block.receipts[1].result.expectOk();
    }
});