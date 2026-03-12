-- Increase service-cards bucket file size limit from 2 MB to 10 MB.
update storage.buckets
set file_size_limit = 10485760
where id = 'service-cards';
