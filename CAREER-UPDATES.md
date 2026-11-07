# 산업기능요원 채용 조사 → 사이트 갱신

대상 저장소: minuk1749/it-opportunity-board, main
사이트: https://raw.githack.com/minuk1749/it-opportunity-board/main/index.html#/careers

채용은 기존 매주 월요일 오전 9시 전후(한국시간) 일정으로 실행한다. 행사 조사(3일마다)와 별도이며 일정 변경·중복 작업 생성은 하지 않는다.

## 현재 자료

careers.json이 사이트의 채용 자료다. 최초 통합은 2026-11-07이며 기존 보드의 실제 조사일 2026-11-02, 78개 회사, 신규 지정 후보 42곳, 38개 변경 이벤트, 4개 조사일 기록을 보존했다. 통합일을 새로운 조사일로 표시하지 않는다. 회사별 checked가 실제 확인일이다.

최초 구성의 숫자는 역사적 기준이다. 신규 회사·기록은 추가할 수 있으며 매번 기존 수량으로 되돌리지 않는다.

## 조사와 저장

1. GitHub 연결 도구로 이 지침과 main의 최신 careers.json을 읽는다. 공개 JSON에 개인 신상·비밀값을 새로 넣지 않는다.
2. 기존 회사 id·과거 events·runs를 유지한다. 실제 회사별 원문을 확인한 경우에만 checked를 갱신한다. 신규 지정 후보를 근거 없이 최종 지정 업체로 바꾸지 않는다.
3. 플랫폼별 마감과 신규 편입 가능성, 필수 학력/경력과 우대를 구분한다. 날짜가 지났다고 회사 전체 모집 종료로 추정하지 않는다. companies.deadline은 원문을 설명한 문자열로 보존하고 기계적으로 날짜 하나로 축약하지 않는다.
4. 마지막 조사 당시의 상태 status: 지원 검토 / 조건 확인 / 예외 문의 / 원문 재확인 / 재공고 감시 / 지정 대기. candidate는 신규 지정 후보 여부 boolean이며 status와 독립이다. 마감 공고는 재공고 감시로 보존한다.
5. company 필수 필드: id,name,region,role,stack,status,checked,eligibility,military,deadline,note,candidate,links. links는 HTTPS url과 label. 기존 추가 필드는 보존한다.
6. events 필드: id,date,companyId,type,title,before,after,action,url,sourceLabel. type은 추가/변경/정정/마감/재확인/확인 필요. url은 검증한 HTTPS 또는 근거 링크가 없을 때 빈 문자열. 이전값은 추측하지 않는다.
7. runs에는 고유 id,date,summary,coverage를 기록하고 sources,checkedCompanyIds,counts 등이 있으면 보존한다. 변경이 없어도 조사 범위·미확인 사항을 남긴다. 같은 run.id 중복을 금지한다.
8. 실제 조사를 완료한 경우에만 lastResearchDate(한국 날짜), updatedAt(시간대 포함 ISO 시각), revision을 갱신한다. 미확인 회사는 기존 checked와 자료를 유지하고 note에 한계를 적는다. siteIntegratedAt은 통합일이므로 변경하지 않는다. automation은 일반 조사에서 수정하지 않는다.
9. JSON 문법·필수 필드·실제 유효 날짜·상태값·id 중복·event.companyId 참조·HTTPS를 검증한다. 로컬 실행이 가능하면 node check.mjs와 npm run check를 사용하되 사용자 PC나 브라우저 로그인에 의존하지 않는다.
10. GitHub 파일 갱신 도구로 최신 careers.json의 blob SHA를 사용해 main에 커밋한다. 충돌 시 최신 파일을 다시 읽고 병합 후 한 번만 재시도한다. 새 조사로 catalog.json, 코드, 일정은 바꾸지 않는다.
11. 커밋 뒤 다시 읽어 실제 날짜·내용·회사와 이벤트가 저장됐는지 확인한다. 성공하면 사이트·커밋 URL을 알린다. 쓰기 실패를 갱신 성공이라고 말하지 않는다.

## 기존 보드 유지

기존 career-updates-board.html (library_file_id: libfile_440150c7dc208191bc895e589fb94bc9)도 같은 파일로 유지한다. 최신 버전의 UI를 보존하고 /*CAREER_DATA_START*/와 /*CAREER_DATA_END*/ 사이 JSON만 이번에 저장한 careers.json 내용으로 동기화한다. '<'를 '\\u003c'로 이스케이프한다. 현재 Library 지침의 교체 절차와 버전 검증을 따른다. 새 파일이나 별도 사이트를 만들지 않는다. 한쪽 저장이 실패하면 GitHub 사이트/기존 보드 중 어느 쪽이 최신인지 정확히 알린다.

## 화면과 실패 동작

채용 화면은 raw.githubusercontent.com의 main/careers.json을 우선 읽고 실패 시 게시된 로컬 JSON을 사용한다. 이미 불러온 자료가 있으면 잘못된 응답이나 최신 원본 연결 실패가 기존 자료를 덮지 않는다. 열린 페이지는 5분마다 새 게시 자료를 확인한다. '최신 채용 목록 불러오기'는 조사를 실행하지 않는다.

필터·저장·회사 상세·날짜별 이력은 같은 회사 id를 재사용한다. next-opportunity-careers-saved 키는 활동 북마크와 별도다. 시간은 Asia/Seoul. 단순 UI 새로고침이나 코드 변경을 조사로 기록하지 않는다.

