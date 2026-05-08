,# NeuroDiseaseConsultFrontend

Фронтенд платформы для консультаций по неврологическим заболеваниям.

## Стек технологий

- **Next.js 15** (App Router) + **React 19** + **TypeScript 5.7**
- **Tailwind CSS 4** — стилизация
- **Zustand 5** — клиентский стейт
- **TanStack React Query 5** — серверный стейт и кеширование запросов

## Структура проекта

```
src/
├── app/           — Next.js App Router (страницы, layout, providers)
├── hooks/         — кастомные React-хуки
├── lib/           — утилиты (api-client.ts)
├── store/         — Zustand-сторы
└── types/         — TypeScript-типы
```

Алиас путей: `@/*` → `./src/*`

## Скрипты

- `npm run dev` — дев-сервер
- `npm run build` — продакшен-сборка
- `npm run lint` — линтинг

## Backend API

Бэкенд: `http://localhost:8080/api`
Авторизация: **Bearer JWT** (Keycloak)

### Роли пользователей

- `DOCTOR` — врач
- `ADMIN` — администратор

### Endpoints

#### Users

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/users/me` | Получить профиль текущего пользователя |
| GET | `/api/users/me/role` | Получить информацию о роли (403 если нет роли DOCTOR/ADMIN) |

**UserEntity:**
```
id: uuid, keycloakId: string, firstName: string, lastName: string, email: string, role: DOCTOR | ADMIN
```

#### Patients

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/patients` | Список всех пациентов текущего врача |
| POST | `/api/patients` | Создать пациента |
| GET | `/api/patients/{patientId}` | Получить пациента по ID |
| PUT | `/api/patients/{patientId}` | Обновить пациента |
| DELETE | `/api/patients/{patientId}` | Удалить пациента |

**CreatePatientRequest / UpdatePatientRequest:**
```
firstName: string, lastName: string, birthDate: date, medicalRecordNumber: string, diagnosisHistory: string
```

**PatientResponse:**
```
id: uuid, firstName: string, lastName: string, dateOfBirth: date, medicalRecordNumber: string, diagnosisHistory: string
```

#### Examinations

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/examinations` | Список всех обследований текущего врача |
| POST | `/api/examinations` | Создать обследование |
| GET | `/api/examinations/{examinationId}` | Получить обследование по ID |
| DELETE | `/api/examinations/{examinationId}` | Удалить обследование |

**CreateExaminationRequest:**
```
patientId: uuid, status: UPLOADED | PROCESSING | COMPLETED | FAILED
```

**ExaminationResponse:**
```
id: uuid, createdDate: datetime, status: UPLOADED | PROCESSING | COMPLETED | FAILED, doctorId: uuid, patientId: uuid
```

#### Raw Data Files

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/raw-data-files?examinationId={uuid}` | Список файлов обследования |
| POST | `/api/raw-data-files?examinationId={uuid}` | Загрузить файл (multipart/form-data) |
| GET | `/api/raw-data-files/{rawDataFileId}` | Метаданные файла |
| DELETE | `/api/raw-data-files/{rawDataFileId}` | Удалить файл |

**RawDataFileResponse:**
```
id: uuid, storageUrl: string, fileSize: int64, fileFormat: string, checkSum: string, examinationId: uuid
```

Файлы хранятся в S3-совместимом хранилище.

#### Decisions

Врачебные решения, построенные на основе одного или нескольких обследований (не более одного на каждый тип обследования).

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/decisions` | Пагинированный список решений текущего врача. Фильтры: `patientId`, `createdDate`, `diseaseProbabilityMin`, `diseaseProbabilityMax`. Возвращает `DecisionSummaryResponse` (без `saccadeVelocity`) |
| POST | `/api/decisions` | Создать решение, связав с ним обследования |
| GET | `/api/decisions/{decisionId}` | Получить решение с привязанными обследованиями и данными визуализации (график скорости саккад) |
| PUT | `/api/decisions/{decisionId}` | Обновить комментарий врача и/или заменить набор привязанных обследований |
| DELETE | `/api/decisions/{decisionId}` | Удалить решение (обследования сохраняются, но отвязываются) |

**CreateDecisionRequest / UpdateDecisionRequest:**
```
examinationIds: uuid[], doctorComment: string
```

**DecisionResponse:**
```
id: uuid, doctorId: uuid, patientId: uuid, doctorComment: string, diseaseProbability: double,
createdDate: datetime, updatedDate: datetime,
examinations: [{ id: uuid, name: string, examinationType: SACCADE_ANALYSIS_V1 | SPEECH_ANALYSIS_V1 }],
saccadeVelocity?: { time: double[], velocity: double[] }
```

Ошибки POST: `400` — дубликаты типов, разные пациенты или обследование уже привязано к другому решению; `404` — обследование не найдено.