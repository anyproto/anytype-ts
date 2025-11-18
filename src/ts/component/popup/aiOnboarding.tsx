import React, { forwardRef, useRef, useEffect, useState, useCallback, ReactNode } from 'react';
import { observer } from 'mobx-react';
import { I, S, U, J, translate, getSparkOnboardingService, keyboard } from 'Lib';
import { Loader, Error, Button, Icon, Label } from 'Component';
import StatusMessage from './page/aiOnboarding/statusMessage';

interface Message {
	id: string;
	type: 'ai' | 'user' | 'typing';
	content: ReactNode;
	timestamp: number;
};

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
	const { SparkOnboarding: sparkOnboarding } = S;
	const theme = S.Common.getThemeClass();
	
	// Error message helper
	const getErrorMessage = (error: I.OnboardingError): string => {
		const errorTranslations: Record<I.OnboardingErrorCode, string> = {
			[I.OnboardingErrorCode.ConnectionFailed]: 'popupAiOnboardingConnectionError',
			[I.OnboardingErrorCode.WorkspaceCreateFailed]: 'popupAiOnboardingWorkspaceCreateError',
			[I.OnboardingErrorCode.ImportFailed]: 'popupAiOnboardingImportError',
			[I.OnboardingErrorCode.Generic]: 'popupAiOnboardingGenericError',
		};
		
		const translationKey = errorTranslations[error.code];
		if (translationKey) {
			return translate(translationKey);
		};
		
		return error.message || translate('popupAiOnboardingGenericError');
	};

	const [ messages, setMessages ] = useState<Message[]>([]);
	const [ inputValue, setInputValue ] = useState('');
	const [ selectedTypes, setSelectedTypes ] = useState<string[]>([]);
	const [ currentQuestionIndex, setCurrentQuestionIndex ] = useState(0);
	const [ waitingForResponse, setWaitingForResponse ] = useState(false);
	const [ randomExamples, setRandomExamples ] = useState<string[]>([]);
	const [ filteredExamples, setFilteredExamples ] = useState<string[]>([]);
	const [ showExamples, setShowExamples ] = useState(true);
	const [ newSpaceId, setNewSpaceId ] = useState<string>('');
	const [ isImporting, setIsImporting ] = useState(false);
	const [ isSending, setIsSending ] = useState(false);
	const [ benefitShown, setBenefitShown ] = useState(false);
	const [ isCreatingSpace, setIsCreatingSpace ] = useState(false);
	
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
		};
		
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
			};
		};
	}, []);

	const addMessage = (type: 'ai' | 'user' | 'typing', content: React.ReactNode, replaceTyping = false) => {
		setMessages(prev => {
			let newMessages = [ ...prev ];
			
			if (replaceTyping) {
				newMessages = newMessages.filter(m => m.type !== 'typing');
			};
			
			const newMessage: Message = {
				id: `msg-${Date.now()}-${Math.random()}`,
				type,
				content,
				timestamp: Date.now()
			};
			
			return [ ...newMessages, newMessage ];
		});

		scrollToBottom();
	};

	const [ currentStatus, setCurrentStatus ] = useState<string>('');
	const [ showStatus, setShowStatus ] = useState<boolean>(false);
	
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
		};
	};

	const handleGoalSubmit = async () => {
		if (!inputValue.trim() || (inputValue.trim().length < 3) || waitingForResponse) {
			return;
		};

		setShowExamples(false);
		setIsSending(true);
		setWaitingForResponse(true); // Disable immediately after sending
		
		addMessage('user', inputValue);

		const goal = inputValue.trim();

		sparkOnboarding.setUserGoal(goal);
		setInputValue('');

		// Show status immediately while waiting for server
		updateStatus(translate('aiOnboardingStatusPreparingQuestions'));
		
		// Start onboarding immediately
		sparkOnboarding.startOnboarding();
		setIsSending(false);
		// Keep waitingForResponse true - will be cleared when questions appear
	};

	const handleQuestionAnswer = () => {
		if (!inputValue.trim() || waitingForResponse) {
			return;
		};

		setWaitingForResponse(true); // Disable immediately after sending
		addMessage('user', inputValue);
		
		const answers = [...(sparkOnboarding.answers || [])];
		answers[currentQuestionIndex] = inputValue.trim();
		sparkOnboarding.setAnswers(answers);
		setInputValue('');

		if (currentQuestionIndex < sparkOnboarding.questions.length - 1) {
			// Show next question immediately - no delay
			setCurrentQuestionIndex(currentQuestionIndex + 1);
			setTimeout(() => {
				addMessage('ai', <Label text={sparkOnboarding.questions[currentQuestionIndex + 1]} />);
				setWaitingForResponse(false); // Re-enable for next question
				inputRef.current?.focus();
			}, 100);
		} else {
			// After last question, keep disabled until benefit message
			updateStatus(translate('aiOnboardingStatusUnderstanding'));
			sparkOnboarding.submitAnswers();
			// waitingForResponse stays true until benefit appears
		};
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

	const handleGoToSpace = () => {
		if (!newSpaceId) {
			return;
		};

		close();
		U.Router.switchSpace(newSpaceId, '', true, {
			onRouteChange: () => {
				U.Space.openDashboard();
			},
		}, false);
	};

	const handleExampleClick = (example: string) => {
		setInputValue(example);
		inputRef.current?.focus();
	};

	const onClose = (force?: boolean) => {
		// If not forced, show confirmation dialog
		if (!force && ((sparkOnboarding.step !== I.OnboardingStep.Goal) || (messages.length > 1))) {
			S.Popup.open('confirm', {
				data: {
					icon: 'confirm',
					title: translate('popupConfirmCloseAIOnboardingTitle'),
					text: translate('popupConfirmCloseAIOnboardingText'),
					textConfirm: translate('popupConfirmCloseAIOnboardingConfirm'),
					textCancel: translate('popupConfirmCloseAIOnboardingCancel'),
					onConfirm: () => {
						sparkOnboarding.disconnect();
						sparkOnboarding.reset();
						close();
					},
				},
			});
		} else {
			sparkOnboarding.disconnect();
			sparkOnboarding.reset();
			close();
		};
	};

	// Initialize
	useEffect(() => {
		const shuffled = [...EXAMPLE_GOALS].sort(() => 0.5 - Math.random());
		const initial = shuffled.slice(0, 6); // Show 6 examples for better coverage
		setRandomExamples(initial);
		setFilteredExamples(initial); // Initially show the random selection
		
		// Ensure input is enabled for initial goal step
		setWaitingForResponse(false);
	}, []);

	// Filter examples based on input
	useEffect(() => {
		// Only filter when on Goal step and examples are shown
		if ((sparkOnboarding.step !== I.OnboardingStep.Goal) || !showExamples) {
			return;
		};

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
				};

				return lowerExample.includes(searchTerm);
			});
			
			// Show up to 6 matches
			setFilteredExamples(matches.slice(0, 6));
		};
	}, [ inputValue, randomExamples, showExamples, sparkOnboarding.step ]);

	// Update status with generation progress
	useEffect(() => {
		if (sparkOnboarding.step != I.OnboardingStep.Generation) {
			return;
		};

		const current = sparkOnboarding.generationProgress.current;
		const total = sparkOnboarding.generationProgress.total;
		
		if (current > 0 && total > 0) {
			if (current === total) {
				updateStatus(translate('aiOnboardingStatusFinalTouches'));
			} else {
				updateStatus(U.Common.sprintf(translate('aiOnboardingStatusCreatingProgress'), current, total));
			};
		} else {
			updateStatus(translate('aiOnboardingStatusGenerating'));
		};
	}, [ sparkOnboarding.generationProgress.current, sparkOnboarding.generationProgress.total, sparkOnboarding.step ]);

	// Handle step changes
	useEffect(() => {
		console.log('[PopupAIOnboarding]: Step changed to:', sparkOnboarding.step);

		switch (sparkOnboarding.step) {
			case I.OnboardingStep.Goal: {
				if (!messages.length) {
					addMessage('ai', (
						<div>
							<Label text={translate('aiOnboardingWelcomeMessage')} />
						</div>
					));
				};
				break;
			};

			case I.OnboardingStep.Questions:
				if (!sparkOnboarding.questions.length || currentQuestionIndex) {
					break;
				};

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
					setWaitingForResponse(false);
					inputRef.current?.focus();
					scrollToBottom();
				}, 100);
				break;

			case I.OnboardingStep.UserBenefit:
				console.log('[PopupAIOnboarding]: UserBenefit case - userBenefit:', sparkOnboarding.userBenefit, 'benefitShown:', benefitShown);
				if (sparkOnboarding.userBenefit && !benefitShown) {
					// Show the benefit text
					addMessage('ai', sparkOnboarding.userBenefit);
					setBenefitShown(true);
					// No need to clear waitingForResponse since input is hidden at this step
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
				
				if ((current > 0) && (total > 0)) {
					if (current === total) {
						updateStatus(translate('aiOnboardingStatusFinalTouches'));
					} else {
						updateStatus(U.Common.sprintf(translate('aiOnboardingStatusCreatingProgress'), current, total));
					};
				} else {
					updateStatus(translate('aiOnboardingStatusGenerating'));
				};
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
				};
				break;
		}
	}, [ sparkOnboarding.step, currentQuestionIndex, benefitShown ]);

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

				if (lastMessage && (lastMessage.type === 'ai')) {
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
				};
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
							<Error text={error || translate('popupAiOnboardingErrorDefault')} />
						</div>
					);
				};

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
		if (waitingForResponse) {
			return;
		};
		
		if (sparkOnboarding.step === I.OnboardingStep.Goal) {
			handleGoalSubmit();
		} else if (sparkOnboarding.step === I.OnboardingStep.Questions) {
			handleQuestionAnswer();
		};
	};

	const allQuestionsAnswered = sparkOnboarding.step === I.OnboardingStep.Questions && 
		sparkOnboarding.answers && 
		sparkOnboarding.answers.length === sparkOnboarding.questions.length;
	
	const showInput = (sparkOnboarding.step === I.OnboardingStep.Goal) || 
		(sparkOnboarding.step === I.OnboardingStep.Questions && !allQuestionsAnswered);
	const showCreateSpace = sparkOnboarding.step === I.OnboardingStep.Complete && sparkOnboarding.manifest;
	const showGoToSpace = newSpaceId && !isImporting;

	// Render loading state only for initial connection
	if (!sparkOnboarding.isConnected && (sparkOnboarding.step === I.OnboardingStep.Goal) && !sparkOnboarding.error && !messages.length) {
		return (
			<div ref={nodeRef} className="wrap">
				<Loader id="loader" />
			</div>
		);
	};

	// Render error state with better UI (but allow retry with loading)
	if (sparkOnboarding.error && (!sparkOnboarding.isLoading || (sparkOnboarding.error.code === I.OnboardingErrorCode.ConnectionFailed))) {
		// Show loading overlay during retry
		if (sparkOnboarding.isLoading) {
			return (
				<div ref={nodeRef} className="wrap">
					<Loader id="loader" />
					<div className="reconnectingOverlay">
						Reconnecting...
					</div>
				</div>
			);
		};

		return (
			<div ref={nodeRef} className="errorStateWrapper">
				<div className="errorContent">
					<div className="errorIcon">
						<Icon className="warning large" />
					</div>
					<div className="errorTitle">{translate('popupAiOnboardingConnectionIssueTitle')}</div>
					<div className="errorMessage">
						{getErrorMessage(sparkOnboarding.error)}
					</div>
					<div className="errorActions">
						<Button 
							className="c28 primary" 
							text={translate('commonRetry')} 
							onClick={() => {
								// Just trigger connect, don't reset error
								// The error will be cleared on successful connection
								sparkOnboarding.connect();
							}} 
						/>

						<Button 
							className="c28 secondary" 
							text={translate('commonClose')} 
							onClick={() => onClose(true)} 
						/>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div ref={nodeRef} className="mainWrapper">
			<div className="chatSection">
				{/* Header */}
				<div className="header">
					<div className="headerContent">
						<div className="title">
							{translate('popupAiOnboardingTitle')} <span className="sparkle">✦</span> Anytype AI
						</div>
						<div className="subtitle">
							{sparkOnboarding.spaceName || translate('popupAiOnboardingDefaultSubtitle')}
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
					<Button 
						className="closeButton" 
						onClick={() => onClose()} 
						text={translate('commonCancel')}
					/>
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
				{showCreateSpace ? (
					<div className="inputArea ctaArea">
						<Button
							className={`ctaButton ${isCreatingSpace ? 'loading' : ''} ${(sparkOnboarding.isLoading || isCreatingSpace) ? 'disabled' : ''}`}
							onClick={() => {
								if (!sparkOnboarding.isLoading && !isCreatingSpace) {
									setIsCreatingSpace(true);
									sparkOnboarding.importWorkspace();
								}
							}}
							text={isCreatingSpace ? 'Loading...' : translate('popupAiOnboardingGoToSpace')}
						/>
					</div>
				) : ''}

				{showInput ? (
					<div className="inputArea">
						{/* Smart Suggestions */}
						{showExamples && sparkOnboarding.step === I.OnboardingStep.Goal && filteredExamples.length > 0 && (
							<div className="smartSuggestions">
								{filteredExamples.map((example, i) => (
									<Button 
										key={i}
										className="suggestionChip"
										onClick={() => handleExampleClick(example)}
										text={example}
									/>
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
									};
								}}
								placeholder={
									sparkOnboarding.step === I.OnboardingStep.Questions 
										? translate('popupAiOnboardingTypeAnswer')
										: translate('popupAiOnboardingDescribeProject')
								}
								rows={1}
							/>
							<Icon 
								className={`send ${isSending ? 'thinking' : ''} ${
									((sparkOnboarding.step === I.OnboardingStep.Goal && inputValue.trim().length < 3) ||
									(sparkOnboarding.step === I.OnboardingStep.Questions && !inputValue.trim()) ||
									waitingForResponse) ? 'disabled' : ''
								}`}
								onClick={handleSubmit}
							/>
						</div>
					</div>
				) : ''}

				{showGoToSpace ? (
					<div className="inputArea ctaArea">
						<Button
							className="ctaButton"
							onClick={handleGoToSpace}
							text={translate('popupAiOnboardingOpenSpace')}
						/>
					</div>
				) : ''}
				</div>
			</div>
		</div>
	);
}));

/*
// Typing Indicator Component
const TypingIndicator = () => (
	<div className="typingDots">
		<span className="dot" />
		<span className="dot" />
		<span className="dot" />
	</div>
);

// Type Card Component (for large grid display)
const TypeCard = ({ type, isSelected, onToggle }) => {
	const cn = [ 'typeCard' ];

	if (isSelected) {
		cn.push('selected');
	};

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
	const cn = [ 'compactTypeBlock' ];
	if (isSelected) {
			cn.push('selected');
	};

	return (
		<div className={cn.join(' ')} onClick={onToggle}>
			{type.icon && <Icon className={type.icon} />}
			<span className="name">{type.name}</span>
		</div>
	);
};
*/

export default PopupAIOnboarding;