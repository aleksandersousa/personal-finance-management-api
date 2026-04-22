# Data Model (DB)

Conventions: `PK` primary key, `FK` foreign key, `UQ` unique.

## `users`

- `id` uuid **PK** not null
- `name` varchar not null
- `email` varchar **UQ** not null
- `password` varchar null
- `avatar_url` varchar null
- `email_verified` boolean not null default `false`
- `created_at` timestamp not null
- `updated_at` timestamp not null

Indexes/constraints:

- **PK**(`id`)
- **UQ**(`email`)

## `email_verification_tokens`

- `id` uuid **PK** not null
- `id_user` uuid **FK -> users.id** not null
- `token` varchar **UQ** not null
- `expires_at` timestamp not null
- `used_at` timestamp null
- `created_at` timestamp not null

Indexes/constraints:

- **PK**(`id`)
- **UQ**(`token`)
- **FK**(`id_user`) -> `users`(`id`)

## `user_settings`

- `id` uuid **PK** not null
- `id_user` uuid **FK -> users.id** not null
- `notifications_enabled` boolean not null default `false`
- `notifications_time_minutes` int not null default `30`
- `timezone` varchar not null default `America/Sao_Paulo`
- `created_at` timestamp not null

Indexes/constraints:

- **PK**(`id`)
- **FK**(`id_user`) -> `users`(`id`)
- **UQ**(`id_user`)

## `password_reset_tokens`

- `id` uuid **PK** not null
- `id_user` uuid **FK -> users.id** not null
- `token` varchar **UQ** not null
- `expires_at` timestamp not null
- `used_at` timestamp null
- `created_at` timestamp not null

Indexes/constraints:

- **PK**(`id`)
- **UQ**(`token`)
- **FK**(`id_user`) -> `users`(`id`)

## `notifications`

- `id` uuid **PK** not null
- `id_user` uuid **FK -> users.id** not null
- `id_entry` uuid **FK -> entries.id** not null
- `job_id` varchar null
- `status` varchar not null
- `scheduled_at` timestamp not null
- `sent_at` timestamp null
- `created_at` timestamp not null
- `updated_at` timestamp not null

Indexes/constraints:

- **PK**(`id`)
- **FK**(`id_user`) -> `users`(`id`)
- **FK**(`id_entry`) -> `entries`(`id`)

## `categories`

- `id` uuid **PK** not null
- `name` varchar **UQ** not null
- `description` varchar null
- `icon` varchar null
- `color` varchar null
- `type` varchar not null
- `created_at` timestamp not null
- `updated_at` timestamp not null

Indexes/constraints:

- **PK**(`id`)
- **UQ**(`name`)

## `user_categories` (join)

- `id_user` uuid **FK -> users.id** not null
- `id_category` uuid **FK -> categories.id** not null

Indexes/constraints:

- **FK**(`id_user`) -> `users`(`id`)
- **FK**(`id_category`) -> `categories`(`id`)
- Enforce join uniqueness with **PK**(`id_user`,`id_category`)

## `recurrences`

- `id` uuid **PK** not null
- `type` varchar not null
- `created_at` timestamp not null

Indexes/constraints:

- **PK**(`id`)

## `entries`

- `id` uuid **PK** not null
- `id_recurrence` uuid **FK -> recurrences.id** null
- `id_user` uuid not null
- `id_category` uuid not null
- `description` varchar not null
- `amount` bigint not null
- `issue_date` date not null
- `due_date` datetime not null
- `created_at` timestamp not null
- `updated_at` timestamp not null

Indexes/constraints:

- **PK**(`id`)
- **FK**(`id_recurrence`) -> `recurrences`(`id`)
- Composite **FK**(`id_user`,`id_category`) -> `user_categories`(`id_user`,`id_category`)

## `payment`

- `id` uuid **PK** not null
- `id_entry` uuid **FK -> entries.id** not null
- `amount` bigint not null
- `created_at` timestamp not null

Indexes/constraints:

- **PK**(`id`)
- **FK**(`id_entry`) -> `entries`(`id`)
- **UQ**(`id_entry`)

## Relationships (cardinality)

- `users` 1 -> N `email_verification_tokens` (via `email_verification_tokens.id_user`)
- `users` 1 -> 1 `user_settings` (via `user_settings.id_user`)
- `users` 1 -> N `password_reset_tokens` (via `password_reset_tokens.id_user`)
- `users` 1 -> N `notifications` (via `notifications.id_user`)
- `recurrences` 1 -> N `entries` (via `entries.id_recurrence`)
- `users` 1 -> N `entries` (via `entries.id_user`, constrained by join `user_categories`)
- `categories` 1 -> N `entries` (via `entries.id_category`, constrained by join `user_categories`)
- `entries` 1 -> N `notifications` (via `notifications.id_entry`)
- `entries` 1 -> 1 `payment` (via `payment.id_entry`)
- `users` N <-> N `categories` (via `user_categories.id_user` + `user_categories.id_category`)
