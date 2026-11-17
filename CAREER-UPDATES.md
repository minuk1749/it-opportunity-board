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

기존 career-updates-board.html (library_file_id: libfile_440150c7dc208191bc895e589fb94bc9)은 열거나 최근 기록 버튼을 누르면 GitHub의 최신 careers.json을 직접 불러온다. 원본을 불러오지 못하면 화면의 직전 데이터 또는 내장된 2026-11-16 저장본을 표시하고 오류와 사용 중인 확인일을 안내한다.

정기 채용 조사는 careers.json만 저장한다. 기존 HTML의 내장 JSON을 매번 다시 생성하거나 교체하지 않는다. HTML의 디자인·기능을 실제로 변경하는 별도 요청이 있을 때만 기존 파일을 수정한다. 현재 조사 성공 여부는 GitHub 커밋과 검증한 careers.json으로 판단한다.

## 화면과 실패 동작

채용 화면은 raw.githubusercontent.com의 main/careers.json을 우선 읽고 실패 시 게시된 로컬 JSON을 사용한다. 이미 불러온 자료가 있으면 잘못된 응답이나 최신 원본 연결 실패가 기존 자료를 덮지 않는다. 열린 페이지는 5분마다 새 게시 자료를 확인한다. '최신 채용 목록 불러오기'는 조사를 실행하지 않는다.

필터·저장·회사 상세·날짜별 이력은 같은 회사 id를 재사용한다. next-opportunity-careers-saved 키는 활동 북마크와 별도다. 시간은 Asia/Seoul. 단순 UI 새로고침이나 코드 변경을 조사로 기록하지 않는다.


## 토큰 효율을 위한 정기 실행

- 최신 GitHub JSON과 blob SHA를 코드 실행 변수에 보관한다. 모델에는 조사일, 회사별 id·이름·상태·candidate·checked·공식 링크와 이번 비교에 필요한 조건만 간략히 출력한다. 전체 JSON, 과거 events·runs, HTML·사이트 코드는 반복 출력하지 않는다. 필요한 회사의 상세 조건과 관련 이력만 조회한다.
- 매주 신규 지원처 탐색 범위를 유지한다. 기존 후보는 실제 모집 중·접수 임박·조건 미확인 업체를 우선 확인한다. 42곳 신규 지정 후보는 병무청의 선정 결과·변경 명단을 함께 확인하고, 새 채용·지정 근거가 있는 업체를 상세 확인한다. 재공고 감시는 채용 목록·신규 공고를 먼저 확인하고 변경 근거가 있을 때 상세 원문을 읽는다. 재확인하지 못한 회사의 checked는 유지하고 조사 범위를 기록한다.
- 코드에 보관한 전체 기준본에 안정적인 id로 추가·변경 필드와 새 이벤트·run만 병합하고 프로그램으로 직렬화한다. 변경 없는 회사와 과거 이력을 모델이 다시 작성하지 않는다. 저장 도구의 전체 파일 입력도 코드 변수에서 전달한다.
- 기존 검증기로 병합 결과를 검사한다. 업로드 후 읽은 전체 파일은 코드에서 예상 결과와 객체 또는 콘텐츠 해시로 비교하고 모델에는 검증 결과·최신 확인일·커밋 링크만 출력한다.
- 최종 알림은 기준일, 추가/변경·정정/마감 건수, 핵심 변화, 사이트·커밋 링크와 확인 한계를 포함해 6줄 이내로 작성한다. 전체 회사 표와 이전 기록은 사이트에서 제공한다.
