import os

from crewai import LLM
from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai_tools import (
	EXASearchTool
)






@CrewBase
class AiSystemManagerCrew:
    """AiSystemManager crew"""

    
    @agent
    def direct_company_job_researcher(self) -> Agent:
        
        
        return Agent(
            config=self.agents_config["direct_company_job_researcher"],
            
            
            tools=[				EXASearchTool()],
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-4o-mini",
                
                
            ),
            
        )
        
    
    @agent
    def user_profile_manager_personalization_specialist(self) -> Agent:
        
        
        return Agent(
            config=self.agents_config["user_profile_manager_personalization_specialist"],
            
            
            tools=[],
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-4o-mini",
                
                
            ),
            
        )
        
    
    @agent
    def company_intelligence_direct_source_specialist(self) -> Agent:
        
        
        return Agent(
            config=self.agents_config["company_intelligence_direct_source_specialist"],
            
            
            tools=[				EXASearchTool()],
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-4o-mini",
                
                
            ),
            
        )
        
    
    @agent
    def company_partnership_direct_sourcing_specialist(self) -> Agent:
        
        
        return Agent(
            config=self.agents_config["company_partnership_direct_sourcing_specialist"],
            
            
            tools=[				EXASearchTool()],
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-4o-mini",
                
                
            ),
            
        )
        
    
    @agent
    def technical_integration_api_specialist(self) -> Agent:
        
        
        return Agent(
            config=self.agents_config["technical_integration_api_specialist"],
            
            
            tools=[				EXASearchTool()],
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-4o-mini",
                
                
            ),
            
        )
        
    
    @agent
    def ai_powered_automation_smart_sourcing_engineer(self) -> Agent:
        
        
        return Agent(
            config=self.agents_config["ai_powered_automation_smart_sourcing_engineer"],
            
            
            tools=[				EXASearchTool()],
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-4o-mini",
                
                
            ),
            
        )
        
    

    
    @task
    def user_profile_system_with_personalized_job_matching(self) -> Task:
        return Task(
            config=self.tasks_config["user_profile_system_with_personalized_job_matching"],
            markdown=False,
            
            
        )
    
    @task
    def phase_1_direct_company_partnership_development(self) -> Task:
        return Task(
            config=self.tasks_config["phase_1_direct_company_partnership_development"],
            markdown=False,
            
            
        )
    
    @task
    def direct_company_job_research(self) -> Task:
        return Task(
            config=self.tasks_config["direct_company_job_research"],
            markdown=False,
            
            
        )
    
    @task
    def phase_2_hr_system_api_integration_architecture(self) -> Task:
        return Task(
            config=self.tasks_config["phase_2_hr_system_api_integration_architecture"],
            markdown=False,
            
            
        )
    
    @task
    def company_intelligence_official_source_analysis(self) -> Task:
        return Task(
            config=self.tasks_config["company_intelligence_official_source_analysis"],
            markdown=False,
            
            
        )
    
    @task
    def phase_3_ai_powered_smart_automation_system(self) -> Task:
        return Task(
            config=self.tasks_config["phase_3_ai_powered_smart_automation_system"],
            markdown=False,
            
            
        )
    
    @task
    def final_platform_integration_launch_strategy(self) -> Task:
        return Task(
            config=self.tasks_config["final_platform_integration_launch_strategy"],
            markdown=False,
            
            
        )
    

    @crew
    def crew(self) -> Crew:
        """Creates the AiSystemManager crew"""

        # Custom manager agent for hierarchical process
        manager_agent = Agent(
            role="Crew Manager",
            goal="Coordinate the team to achieve the objective efficiently",
            backstory="An experienced manager skilled in delegation and coordination",
            llm=LLM(model="openai/gpt-4o-mini"),
            allow_delegation=True,
        )

        return Crew(
            agents=self.agents,  # Automatically created by the @agent decorator
            tasks=self.tasks,  # Automatically created by the @task decorator
            process=Process.hierarchical,
            verbose=True,


            manager_agent=manager_agent,


            chat_llm=LLM(model="openai/gpt-4o-mini"),
        )


