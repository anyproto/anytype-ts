import React, { forwardRef, useRef, useEffect, useState, useCallback } from 'react';
import { observer } from 'mobx-react';
import { I, S, U, translate, getSparkOnboardingService, keyboard } from 'Lib';
import { Loader, Error, Button, Icon, Label } from 'Component';
import StatusMessage from './page/aiOnboarding/statusMessage';
import $ from 'jquery';

interface Message {
	id: string;
	type: 'ai' | 'user' | 'typing';
	content: React.ReactNode;
	timestamp: number;
}

// Example goals - diverse use cases across multiple spheres
const EXAMPLE_GOALS = [
	// Creative & Writing
	'I\'m writing a novel and need to track characters and plot',
	'I want to build a world for my fantasy story with maps and lore',
	'I\'m creating a comic book and need to organize scripts and artwork',
	'I\'m writing poetry and want to organize themes and inspirations',
	'I need to manage my blog content calendar and ideas',
	
	// Business & Entrepreneurship
	'I\'m starting a business and need to plan everything',
	'I\'m planning a product launch',
	'I need to track my freelance clients and projects',
	'I want to organize my startup\'s investor pitch deck',
	'I\'m building a SaaS and need to track features and roadmap',
	'I need to manage my e-commerce inventory and suppliers',
	
	// Learning & Education
	'I want to learn programming and track my progress',
	'I\'m studying for medical school and need to organize notes',
	'I\'m learning a new language and want to track vocabulary',
	'I need to prepare for professional certifications',
	'I\'m homeschooling my kids and need to plan curriculum',
	'I want to build a personal learning path for data science',
	
	// Research & Academia
	'I\'m researching a topic and collecting insights',
	'I\'m writing my PhD thesis and need to organize literature',
	'I need to manage my scientific experiments and data',
	'I\'m conducting user research and need to synthesize findings',
	'I want to track market research for my industry analysis',
	
	// Personal Finance & Investments
	'I want to track my investment portfolio and strategies',
	'I need to plan my path to financial independence',
	'I\'m managing rental properties and need to track everything',
	'I want to organize my tax documents and deductions',
	'I need to plan and track my budget and savings goals',
	'I\'m analyzing cryptocurrency projects and investments',
	
	// Health & Wellness
	'I need a creative space for my art projects',
	'I want to track my fitness journey and workout plans',
	'I\'m managing a chronic condition and tracking symptoms',
	'I need to plan my meals and track nutrition',
	'I want to document my mental health journey and patterns',
	'I\'m training for a marathon and need to track progress',
	
	// Hobbies & Collections
	'I want to organize my board game collection and sessions',
	'I\'m building model trains and need to track parts and layouts',
	'I collect vintage watches and want to catalog them',
	'I\'m into photography and need to organize shoots and locations',
	'I want to track my reading list and book notes',
	'I\'m a wine enthusiast tracking tastings and vintages',
	
	// Home & Family
	'I want to document my family history',
	'I\'m planning a wedding and need to track everything',
	'I need to organize home renovation projects and contractors',
	'I want to create a digital recipe book with family recipes',
	'I\'m planning our family vacation itineraries',
	'I need to manage household maintenance schedules',
	
	// Professional & Career
	'I need to solve workflow inefficiencies at work',
	'I want to track my career goals and achievements',
	'I\'m preparing for job interviews and need to organize materials',
	'I need to manage my professional network and contacts',
	'I want to document processes for my team',
	'I\'m building my personal brand and content strategy',
	
	// Technology & Development
	'I want to build a second brain for my ideas',
	'I\'m developing an app and need to track bugs and features',
	'I need to organize my code snippets and solutions',
	'I want to document my homelab setup and configurations',
	'I\'m learning DevOps and tracking my infrastructure projects',
	'I need to manage multiple open source contributions',
	
	// Community & Social Impact
	'I\'m organizing a community garden project',
	'I want to track volunteer work and social impact',
	'I\'m planning a charity fundraiser event',
	'I need to manage a non-profit organization\'s projects',
	'I want to document local history and stories',
	
	// Gaming & Entertainment
	'I\'m designing a tabletop RPG campaign world',
	'I want to track my video game backlog and reviews',
	'I\'m organizing an esports team and strategies',
	'I need to plan my streaming content and schedule',
	'I want to create a universe for my game development project'
];

const PopupAIOnboarding = observer(forwardRef<{}, I.Popup>(({ param = {}, getId, close }, ref) => {
	const nodeRef = useRef(null);
	const messagesEndRef = useRef(null);
	const inputRef = useRef(null);
	const { sparkOnboarding } = S;

	const [messages, setMessages] = useState<Message[]>([]);
	const [inputValue, setInputValue] = useState('');
	const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [randomExamples, setRandomExamples] = useState<string[]>([]);
	const [filteredExamples, setFilteredExamples] = useState<string[]>([]);
	const [showExamples, setShowExamples] = useState(true);
	const [newSpaceId, setNewSpaceId] = useState<string>('');
	const [isImporting, setIsImporting] = useState(false);
	const [isSending, setIsSending] = useState(false);
	const [benefitShown, setBenefitShown] = useState(false);
	const [isCreatingSpace, setIsCreatingSpace] = useState(false);
	

	const scrollToBottom = () => {
		setTimeout(() => {
			messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
		}, 50);
	};
	
	// Handle scroll events to show/hide scrollbar
	const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
		const wrapper = e.currentTarget;
		
		// Add scrolling class
		wrapper.classList.add('isScrolling');
		
		// Clear existing timeout
		if (scrollTimeoutRef.current) {
			clearTimeout(scrollTimeoutRef.current);
		}
		
		// Remove scrolling class after scrolling stops
		scrollTimeoutRef.current = setTimeout(() => {
			wrapper.classList.remove('isScrolling');
		}, 1000); // Hide scrollbar 1 second after scrolling stops
	}, []);
	
	// Cleanup scroll timeout on unmount
	useEffect(() => {
		return () => {
			if (scrollTimeoutRef.current) {
				clearTimeout(scrollTimeoutRef.current);
			}
		};
	}, []);

	const addMessage = (type: 'ai' | 'user' | 'typing', content: React.ReactNode, replaceTyping = false) => {
		setMessages(prev => {
			let newMessages = [...prev];
			
			if (replaceTyping) {
				newMessages = newMessages.filter(m => m.type !== 'typing');
			}
			
			const newMessage: Message = {
				id: `msg-${Date.now()}-${Math.random()}`,
				type,
				content,
				timestamp: Date.now()
			};
			
			return [...newMessages, newMessage];
		});
		scrollToBottom();
	};

	const [currentStatus, setCurrentStatus] = useState<string>('');
	const [showStatus, setShowStatus] = useState<boolean>(false);
	
	const updateStatus = (status: string) => {
		if (status) {
			setCurrentStatus(status);
			setShowStatus(true);
			// Scroll to bottom when status appears
			setTimeout(() => scrollToBottom(), 50);
		} else {
			// Empty status means hide it
			setShowStatus(false);
			// Clear the status text after animation
			setTimeout(() => {
				setCurrentStatus('');
			}, 300);
		}
	};


	const handleGoalSubmit = async () => {
		if (!inputValue.trim() || inputValue.trim().length < 3) {
			return;
		}

		setShowExamples(false);
		setIsSending(true);
		
		addMessage('user', inputValue);
		const goal = inputValue.trim();
		sparkOnboarding.setUserGoal(goal);
		setInputValue('');

		// Show status immediately while waiting for server
		updateStatus(translate('aiOnboardingStatusPreparingQuestions'));
		
		// Start onboarding immediately
		sparkOnboarding.startOnboarding();
		setIsSending(false);
	};

	const handleQuestionAnswer = () => {
		if (!inputValue.trim()) {
			return;
		}

		addMessage('user', inputValue);
		
		const answers = [...(sparkOnboarding.answers || [])];
		answers[currentQuestionIndex] = inputValue.trim();
		sparkOnboarding.setAnswers(answers);
		setInputValue('');

		if (currentQuestionIndex < sparkOnboarding.questions.length - 1) {
			// Show next question immediately - no delay
			setCurrentQuestionIndex(currentQuestionIndex + 1);
			addMessage('ai', <Label text={sparkOnboarding.questions[currentQuestionIndex + 1]} />);
		} else {
			// After last question, show status while waiting for server response
			updateStatus(translate('aiOnboardingStatusUnderstanding'));
			sparkOnboarding.submitAnswers();
		}
	};

	const handleTypeSelection = () => {
		if (selectedTypes.length === 0) {
			return;
		}
		
		addMessage('user', `Selected ${selectedTypes.length} types`);
		sparkOnboarding.setSelectedTypes(selectedTypes);

		// Show immediate feedback and start generation
		addMessage('ai', 
			<div>
				<Label text={translate('aiOnboardingBuildingSpace')} />
			</div>
		);
		
		// Confirm types immediately to start generation
		sparkOnboarding.confirmTypes();
	};

	const handleImport = () => {
		setIsImporting(true);
		sparkOnboarding.importWorkspace();
	};

	const handleGoToSpace = () => {
		if (newSpaceId) {
			close();
			U.Router.switchSpace(newSpaceId, '', true, {
				onRouteChange: () => {
					U.Space.openDashboard({ replace: true });
				}
			}, false);
		}
	};

	const handleExampleClick = (example: string) => {
		setInputValue(example);
		inputRef.current?.focus();
	};

	const onClose = (force?: boolean) => {
		// If not forced, show confirmation dialog
		if (!force && (sparkOnboarding.step !== I.OnboardingStep.Goal || messages.length > 1)) {
			S.Popup.open('confirm', {
				data: {
					icon: 'confirm',
					title: translate('popupConfirmCloseAIOnboardingTitle') || 'Exit AI Onboarding?',
					text: translate('popupConfirmCloseAIOnboardingText') || 'Are you sure you want to exit? Your progress will be lost.',
					textConfirm: translate('commonYes') || 'Yes, Exit',
					textCancel: translate('commonNo') || 'Continue',
					onConfirm: () => {
						sparkOnboarding.disconnect();
						sparkOnboarding.reset();
						close();
					}
				}
			});
		} else {
			sparkOnboarding.disconnect();
			sparkOnboarding.reset();
			close();
		}
	};

	// Initialize
	useEffect(() => {
		const shuffled = [...EXAMPLE_GOALS].sort(() => 0.5 - Math.random());
		const initial = shuffled.slice(0, 6); // Show 6 examples for better coverage
		setRandomExamples(initial);
		setFilteredExamples(initial); // Initially show the random selection
	}, []);

	// Filter examples based on input
	useEffect(() => {
		// Only filter when on Goal step and examples are shown
		if (sparkOnboarding.step !== I.OnboardingStep.Goal || !showExamples) {
			return;
		}

		const searchTerm = inputValue.toLowerCase().trim();
		
		if (!searchTerm) {
			// If no input, show the random selection
			setFilteredExamples(randomExamples);
		} else {
			// Filter ALL examples based on the search term
			const matches = EXAMPLE_GOALS.filter(example => {
				const lowerExample = example.toLowerCase();
				// Hide if it's an exact match (user already typed it or clicked it)
				if (lowerExample === searchTerm) {
					return false;
				}
				return lowerExample.includes(searchTerm);
			});
			
			// Show up to 6 matches
			setFilteredExamples(matches.slice(0, 6));
		}
	}, [inputValue, randomExamples, showExamples, sparkOnboarding.step]);

	// Update status with generation progress
	useEffect(() => {
		if (sparkOnboarding.step === I.OnboardingStep.Generation) {
			const current = sparkOnboarding.generationProgress.current;
			const total = sparkOnboarding.generationProgress.total;
			
			if (current > 0 && total > 0) {
				if (current === total) {
					updateStatus(translate('aiOnboardingStatusFinalTouches'));
				} else {
					updateStatus(U.Common.sprintf(translate('aiOnboardingStatusCreatingProgress'), current, total));
				}
			} else {
				updateStatus(translate('aiOnboardingStatusGenerating'));
			}
		}
	}, [sparkOnboarding.generationProgress.current, sparkOnboarding.generationProgress.total, sparkOnboarding.step]);


	// Handle step changes
	useEffect(() => {
		console.log('[AIOnboarding Component] Step changed to:', sparkOnboarding.step);
		switch (sparkOnboarding.step) {
			case I.OnboardingStep.Goal:
				if (messages.length === 0) {
					addMessage('ai', (
						<div>
							<Label text={translate('aiOnboardingWelcomeMessage')} />
						</div>
					));
				}
				break;

			case I.OnboardingStep.Questions:
				if (sparkOnboarding.questions.length > 0 && currentQuestionIndex === 0) {
					// Clear status since questions are ready
					updateStatus('');
					// Show intro message
					addMessage('ai', 
						<div>
							<Label text={translate('aiOnboardingQuestionsIntro')} />
						</div>
					);
					scrollToBottom();
					// Show first question right after
					setTimeout(() => {
						addMessage('ai', <Label text={sparkOnboarding.questions[0]} />);
						scrollToBottom();
					}, 100);
				}
				break;

			case I.OnboardingStep.UserBenefit:
				console.log('[AIOnboarding Component] UserBenefit case - userBenefit:', sparkOnboarding.userBenefit, 'benefitShown:', benefitShown);
				if (sparkOnboarding.userBenefit && !benefitShown) {
					console.log('[AIOnboarding Component] Showing user benefit message');
					// Show the benefit text
					addMessage('ai', sparkOnboarding.userBenefit);
					setBenefitShown(true);
					scrollToBottom();
					
					// Show status immediately for drafting types
					setTimeout(() => {
						updateStatus(translate('aiOnboardingStatusDraftingTypes'));
					}, 100);
				}
				break;

			// TypeReview step is now auto-skipped - types are submitted automatically
			// The store will auto-confirm all types and jump to Generation step

			case I.OnboardingStep.Generation:
				// Initial status will be updated by the progress tracking useEffect
				const current = sparkOnboarding.generationProgress.current;
				const total = sparkOnboarding.generationProgress.total;
				
				if (current > 0 && total > 0) {
					if (current === total) {
						updateStatus(translate('aiOnboardingStatusFinalTouches'));
					} else {
						updateStatus(U.Common.sprintf(translate('aiOnboardingStatusCreatingProgress'), current, total));
					}
				} else {
					updateStatus(translate('aiOnboardingStatusGenerating'));
				}
				break;

			case I.OnboardingStep.Complete:
				// Clear status - generation is done, no more waiting
				updateStatus('');
				// Add completion message
				if (sparkOnboarding.manifest) {
					addMessage('ai', 
						<div>
							<Label text={translate('aiOnboardingSpaceReady')} />
						</div>
					);
				}
				break;
		}
	}, [sparkOnboarding.step, currentQuestionIndex, benefitShown]);

	// Listen for import success/error
	useEffect(() => {
		const service = getSparkOnboardingService();
		
		const handleImportSuccess = (spaceId: string) => {
			setNewSpaceId(spaceId);
			setIsImporting(false);
			setIsCreatingSpace(false);
			
			setMessages(prev => {
				const newMessages = [...prev];
				const lastMessage = newMessages[newMessages.length - 1];
				if (lastMessage && lastMessage.type === 'ai') {
					lastMessage.content = (
						<div className="completionMessage">
							<Icon className="success large" />
							<div className="title">All set! Your space is ready to explore.</div>
							<div className="spaceInfo">
								<div className="spaceName">{sparkOnboarding.manifest.spaceName}</div>
								<div className="stat success">✓ {sparkOnboarding.manifest.typesCount} types created</div>
								<div className="stat success">✓ {sparkOnboarding.manifest.objectsCount} objects added</div>
							</div>
						</div>
					);
				}
				return newMessages;
			});
		};

		const handleImportError = (error: string) => {
			setIsImporting(false);
			setIsCreatingSpace(false);
			setMessages(prev => {
				const newMessages = [...prev];
				const lastMessage = newMessages[newMessages.length - 1];
				if (lastMessage && lastMessage.type === 'ai') {
					lastMessage.content = (
						<div>
							<Error text={error || 'Something went wrong. Please try again.'} />
						</div>
					);
				}
				return newMessages;
			});
		};

		service.on('importSuccess', handleImportSuccess);
		service.on('importError', handleImportError);

		return () => {
			service.off('importSuccess', handleImportSuccess);
			service.off('importError', handleImportError);
		};
	}, [sparkOnboarding.manifest]);


	// Initialize connection
	useEffect(() => {
		// Prevent keyboard events from reaching the underlying editor
		keyboard.setFocus(true);
		
		sparkOnboarding.init();
		sparkOnboarding.connect();

		return () => {
			// Restore keyboard focus when popup closes
			keyboard.setFocus(false);
			sparkOnboarding.disconnect();
		};
	}, []);

	// Handle submit
	const handleSubmit = () => {
		if (sparkOnboarding.step === I.OnboardingStep.Goal) {
			handleGoalSubmit();
		} else if (sparkOnboarding.step === I.OnboardingStep.Questions) {
			handleQuestionAnswer();
		}
	};

	const showInput = sparkOnboarding.step === I.OnboardingStep.Goal || sparkOnboarding.step === I.OnboardingStep.Questions;
	const showCreateSpace = sparkOnboarding.step === I.OnboardingStep.Complete && sparkOnboarding.manifest;
	const showGoToSpace = newSpaceId && !isImporting;

	// Render loading state only for initial connection
	if (!sparkOnboarding.isConnected && sparkOnboarding.step === I.OnboardingStep.Goal && !sparkOnboarding.error && messages.length === 0) {
		return (
			<div ref={nodeRef} className="wrap">
				<Loader id="loader" />
			</div>
		);
	}

	// Render error state with better UI (but allow retry with loading)
	if (sparkOnboarding.error && (!sparkOnboarding.isLoading || sparkOnboarding.error === 'Failed to connect to onboarding service')) {
		// Show loading overlay during retry
		if (sparkOnboarding.isLoading) {
			return (
				<div ref={nodeRef} className="wrap">
					<Loader id="loader" />
					<div style={{ textAlign: 'center', marginTop: '20px', color: 'rgba(0,0,0,0.6)' }}>
						Reconnecting...
					</div>
				</div>
			);
		}
		return (
			<div ref={nodeRef} className="errorStateWrapper">
				<div className="errorContent">
					<div className="errorIcon">
						<Icon className="warning large" />
					</div>
					<div className="errorTitle">Connection Issue</div>
					<div className="errorMessage">
						{sparkOnboarding.error === 'Failed to connect to onboarding service' 
							? 'Unable to connect to the AI service. Please check your internet connection and try again.'
							: sparkOnboarding.error}
					</div>
					<div className="errorActions">
						<Button 
							className="c28 primary" 
							text="Try Again" 
							onClick={() => {
								// Just trigger connect, don't reset error
								// The error will be cleared on successful connection
								sparkOnboarding.connect();
							}} 
						/>
						<Button 
							className="c28 secondary" 
							text="Close" 
							onClick={() => onClose(true)} 
						/>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div ref={nodeRef} className="mainWrapper">
				<div className="chatSection">
					{/* Header */}
					<div className="header">
						<div className="headerContent">
							<div className="title">
								Create Your Perfect Space <span className="sparkle">✦</span> Anytype AI
							</div>
							<div className="subtitle">
								{sparkOnboarding.spaceName || 'Share your ideas, projects, or problems to solve'}
							</div>
							<div className="progressPills">
								{[0, 1, 2, 3, 4, 5].map(i => {
									const isActive = i === sparkOnboarding.stepIndex;
									const isCompleted = i < sparkOnboarding.stepIndex;
									const cn = ['pill'];
									
									if (isActive) cn.push('active');
									if (isCompleted) cn.push('completed');
									
									return <div key={i} className={cn.join(' ')} />;
								})}
							</div>
						</div>
						<button className="closeButton" onClick={() => onClose()} title="Exit">
							Exit
						</button>
					</div>

					{/* Chat Container */}
					<div className="chatContainer">
						<div className="messagesWrapper" onScroll={handleScroll}>
						{messages.map(message => (
							<div key={message.id} className={`message ${message.type}`}>
								{message.type === 'typing' ? (
									message.content
								) : (
									<div className="bubble">
										{message.content}
									</div>
								)}
							</div>
						))}
						{/* Status appears as a message bubble when active */}
						{showStatus && currentStatus && (
							<div className="message ai">
								<div className="bubble">
									<StatusMessage text={currentStatus} isActive={true} />
								</div>
							</div>
						)}
						<div ref={messagesEndRef} />
					</div>

					{/* Input Area */}
					{showCreateSpace && (
						<div className="inputArea ctaArea">
							<button
								className={`ctaButton ${isCreatingSpace ? 'loading' : ''}`}
								onClick={() => {
									setIsCreatingSpace(true);
									sparkOnboarding.importWorkspace();
								}}
								disabled={sparkOnboarding.isLoading || isCreatingSpace}
							>
								{isCreatingSpace ? (
									<>
										<span className="loader"></span>
										<span>Loading...</span>
									</>
								) : (
									'Go to Your Space'
								)}
							</button>
						</div>
					)}
					{showInput && (
						<div className="inputArea">
							{/* Smart Suggestions */}
							{showExamples && sparkOnboarding.step === I.OnboardingStep.Goal && filteredExamples.length > 0 && (
								<div className="smartSuggestions">
									{filteredExamples.map((example, i) => (
										<button 
											key={i}
											className="suggestionChip"
											onClick={() => handleExampleClick(example)}
										>
											{example}
										</button>
									))}
								</div>
							)}
							
							<div className="inputWrapper">
								<textarea
									ref={inputRef}
									className="textarea"
									value={inputValue}
									onChange={(e) => setInputValue(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' && !e.shiftKey) {
											e.preventDefault();
											handleSubmit();
										}
									}}
									placeholder={
										sparkOnboarding.step === I.OnboardingStep.Questions 
											? 'Type your answer...'
											: 'Describe your project, passion, or problem...'
									}
									rows={1}
								/>
								<Icon 
									className={`send ${isSending ? 'thinking' : ''} ${
										((sparkOnboarding.step === I.OnboardingStep.Goal && inputValue.trim().length < 3) ||
										(sparkOnboarding.step === I.OnboardingStep.Questions && !inputValue.trim())) ? 'disabled' : ''
									}`}
									onClick={handleSubmit}
								/>
							</div>
						</div>
					)}
					{showGoToSpace && (
						<div className="inputArea ctaArea">
							<button
								className="ctaButton"
								onClick={handleGoToSpace}
							>
								Open Space →
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}));

// Typing Indicator Component
const TypingIndicator = () => (
	<div className="typingDots">
		<span className="dot"></span>
		<span className="dot"></span>
		<span className="dot"></span>
	</div>
);

// Type Card Component (for large grid display)
const TypeCard = ({ type, isSelected, onToggle }) => {
	const cn = ['typeCard'];
	if (isSelected) cn.push('selected');

	return (
		<div className={cn.join(' ')} onClick={onToggle}>
			<div className="header">
				{type.icon && <Icon className={type.icon} />}
				<div className="name">{type.name}</div>
				{isSelected && <Icon className="check" />}
			</div>
		</div>
	);
};

// Compact Type Block Component (for inline chat display)
const CompactTypeBlock = ({ type, isSelected, onToggle }) => {
	const cn = ['compactTypeBlock'];
	if (isSelected) cn.push('selected');

	return (
		<div className={cn.join(' ')} onClick={onToggle}>
			{type.icon && <Icon className={type.icon} />}
			<span className="name">{type.name}</span>
		</div>
	);
};


export default PopupAIOnboarding;
