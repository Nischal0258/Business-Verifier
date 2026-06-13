def calculate_student_trust_score(company_data: dict, opportunities: list, social_media: dict, reviews: dict) -> dict:
    total = 0
    breakdown = {}
    
    # Hiring
    jobs_count = len(opportunities)
    if jobs_count == 0: pts = 0
    elif jobs_count <= 3: pts = 10
    elif jobs_count <= 10: pts = 18
    else: pts = 25
    total += pts
    breakdown['hiring'] = pts
    
    # Reviews
    rating = reviews.get('average_rating')
    if not rating: pts = 5
    elif rating < 2.5: pts = 3
    elif rating <= 3.5: pts = 10
    elif rating <= 4.0: pts = 16
    else: pts = 20
    total += pts
    breakdown['reviews'] = pts
    
    # Social
    active = sum(1 for v in social_media.values() if v)
    if active == 0: pts = 0
    elif active <= 2: pts = 7
    elif active <= 4: pts = 12
    else: pts = 15
    total += pts
    breakdown['social'] = pts
    
    # Legitimacy
    legit = 0
    if company_data.get('website'): legit += 5
    if company_data.get('description'): legit += 4
    if company_data.get('industry'): legit += 3
    if company_data.get('jurisdiction') or company_data.get('headquarters_info'): legit += 3
    total += legit
    breakdown['legitimacy'] = legit
    
    # Intern friendly
    intern = 0
    has_intern = any('intern' in str(o.get('title','')).lower() for o in opportunities)
    if has_intern: intern += 8
    total += intern
    breakdown['intern_friendly'] = intern
    
    # Growth (mocked for now)
    growth = 5
    total += growth
    breakdown['growth'] = growth
    
    tier = 'unknown'
    if total >= 80: tier = 'established'
    elif total >= 60: tier = 'rising_star'
    elif total >= 40: tier = 'emerging'
    
    return {
        'total_score': total,
        'company_tier': tier,
        'is_recommended': total >= 60,
        'breakdown': breakdown,
        'verdict': f"A {tier} company with score {total}."
    }
