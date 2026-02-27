CREATE INDEX "idx_credit_transaction_user_id" ON "credit_transaction" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_transaction_user_id" ON "transaction" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_transaction_product_id" ON "transaction" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_tryout_attempt_tryout_id" ON "tryout_attempt" USING btree ("tryout_id");--> statement-breakpoint
CREATE INDEX "idx_tryout_subtest_attempt_subtest_id" ON "tryout_subtest_attempt" USING btree ("subtest_id");