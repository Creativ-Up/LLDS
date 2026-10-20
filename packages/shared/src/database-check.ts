// Vérification à la compilation : les énumérations TypeScript reflètent exactement
// les types Postgres générés (`pnpm db:types`). Une divergence casse `pnpm typecheck`.
import type { Database } from './database.types';
import type * as E from './schemas/enums';

type DbEnums = Database['public']['Enums'];
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Assert<T extends true> = T;

export type EnumsMatch = [
  Assert<Same<DbEnums['lang_code'], E.Lang>>,
  Assert<Same<DbEnums['line_status'], E.LineStatus>>,
  Assert<Same<DbEnums['stop_service'], E.StopService>>,
  Assert<Same<DbEnums['stop_media_kind'], E.StopMediaKind>>,
  Assert<Same<DbEnums['stamp_rule'], E.StampRule>>,
  Assert<Same<DbEnums['media_bucket'], E.MediaBucket>>,
  Assert<Same<DbEnums['user_role'], E.UserRole>>,
  Assert<Same<DbEnums['transport_mode'], E.TransportMode>>,
  Assert<Same<DbEnums['experience_type'], E.ExperienceType>>,
  Assert<Same<DbEnums['text_size'], E.TextSize>>,
  Assert<Same<DbEnums['line_direction'], E.LineDirection>>,
  Assert<Same<DbEnums['progress_status'], E.ProgressStatus>>,
];
