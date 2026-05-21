-- Optional social links (admin); empty = hidden on public contact page
ALTER TABLE contact_info
  ADD COLUMN telegram_url VARCHAR(512) NULL DEFAULT NULL AFTER description,
  ADD COLUMN tiktok_url VARCHAR(512) NULL DEFAULT NULL AFTER telegram_url,
  ADD COLUMN instagram_url VARCHAR(512) NULL DEFAULT NULL AFTER tiktok_url,
  ADD COLUMN facebook_url VARCHAR(512) NULL DEFAULT NULL AFTER instagram_url;
